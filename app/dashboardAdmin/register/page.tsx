"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  Phone,
  Mail,
  Lock,
  Building,
  MapPin,
  Users,
  CreditCard,
  Calendar,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { signIn } from "next-auth/react";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "manager",
    companyName: "",
    newCompanyName: "", // Added to store the new company name input
    location: "",
    subscriptionType: "free",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    isNewCompany: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [companies, setCompanies] = useState([]);
  const router = useRouter();

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch("/api/company");
        if (!res.ok) throw new Error("Failed to fetch companies");
        const data = await res.json();
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setCompanies([]);
      }
    };
    fetchCompanies();
  }, []);

  // Auto-set subscription dates and limits based on subscription type for new companies
  useEffect(() => {
    if (formData.isNewCompany && formData.subscriptionType) {
      const startDate = new Date();
      let endDate = new Date();
      let maxClientRegistrations = 5;
      let maxPayments = 20;

      if (formData.subscriptionType === "free") {
        endDate.setDate(startDate.getDate() + 21); // 21 days for free
        maxClientRegistrations = 5;
        maxPayments = 20;
      } else if (formData.subscriptionType === "premium") {
        maxClientRegistrations = 50;
        maxPayments = 100;
      } else if (formData.subscriptionType === "enterprise") {
        maxClientRegistrations = 300;
        maxPayments = 1000;
      }

      setFormData((prev) => ({
        ...prev,
        subscriptionStartDate: startDate.toISOString().split("T")[0],
        subscriptionEndDate:
          formData.subscriptionType === "free"
            ? endDate.toISOString().split("T")[0]
            : prev.subscriptionEndDate,
      }));
    }
  }, [formData.subscriptionType, formData.isNewCompany]);

  const validateEmail = () => {
    if (!formData.email) {
      return "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Please enter a valid email";
    }
    return null;
  };

  const validatePhone = () => {
    if (!formData.phone) {
      return "Phone number is required";
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
      return "Please enter a valid phone number";
    }
    return null;
  };

  const validatePassword = () => {
    if (!formData.password) {
      return "Password is required";
    } else {
      if (formData.password.length < 8) {
        return "Password must be at least 8 characters";
      } else if (!/[A-Z]/.test(formData.password)) {
        return "Password must contain at least one uppercase letter";
      } else if (!/[0-9]/.test(formData.password)) {
        return "Password must contain at least one number";
      }
    }
    return null;
  };

  const validateConfirmPassword = () => {
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  const validateStep1 = () => {
    const emailError = validateEmail();
    const phoneError = validatePhone();
    const passwordError = validatePassword();
    const confirmPasswordError = validateConfirmPassword();

    const newErrors = {};
    if (emailError) newErrors.email = emailError;
    if (phoneError) newErrors.phone = phoneError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.role) {
      newErrors.role = "Role is required";
    } else if (
      !["manager", "coach", "superadmin"].includes(formData.role.toLowerCase())
    ) {
      newErrors.role = "Invalid role selected";
    }

    if (formData.isNewCompany) {
      if (!formData.newCompanyName.trim()) {
        newErrors.companyName = "New company name is required";
      }

      if (!formData.subscriptionType) {
        newErrors.subscriptionType = "Subscription type is required";
      } else if (
        !["free", "premium", "enterprise"].includes(
          formData.subscriptionType.toLowerCase()
        )
      ) {
        newErrors.subscriptionType = "Invalid subscription type selected";
      }

      if (
        formData.subscriptionType !== "free" &&
        (!formData.subscriptionStartDate || !formData.subscriptionEndDate)
      ) {
        if (!formData.subscriptionStartDate)
          newErrors.subscriptionStartDate = "Start date is required";
        if (!formData.subscriptionEndDate)
          newErrors.subscriptionEndDate = "End date is required";
      }

      if (formData.subscriptionStartDate && formData.subscriptionEndDate) {
        const startDate = new Date(formData.subscriptionStartDate);
        const endDate = new Date(formData.subscriptionEndDate);

        if (
          !isNaN(startDate.getTime()) &&
          !isNaN(endDate.getTime()) &&
          endDate <= startDate
        ) {
          newErrors.subscriptionEndDate = "End date must be after start date";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = (e) => {
    e.preventDefault();
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === "password") {
      let strength = 0;
      if (value.length >= 8) strength += 1;
      if (/[A-Z]/.test(value)) strength += 1;
      if (/[0-9]/.test(value)) strength += 1;
      if (/[^A-Za-z0-9]/.test(value)) strength += 1;
      setPasswordStrength(strength);
    }
  };

  const handleCompanyChange = (e) => {
    const { value } = e.target;
    const selectedCompany = companies.find((c) => c.name === value);
    setFormData((prev) => ({
      ...prev,
      companyName: selectedCompany ? value : prev.newCompanyName,
      newCompanyName: selectedCompany ? "" : prev.newCompanyName,
      isNewCompany: value === "new" || !selectedCompany,
      subscriptionType: selectedCompany
        ? selectedCompany.subscriptionType
        : prev.subscriptionType,
      subscriptionStartDate: selectedCompany
        ? selectedCompany.subscriptionStartDate?.split("T")[0]
        : prev.subscriptionStartDate,
      subscriptionEndDate: selectedCompany
        ? selectedCompany.subscriptionEndDate?.split("T")[0]
        : prev.subscriptionEndDate,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          companyName: formData.isNewCompany
            ? formData.newCompanyName
            : formData.companyName,
          location: formData.isNewCompany ? formData.location : null,
          subscriptionType: formData.isNewCompany
            ? formData.subscriptionType
            : null,
          subscriptionStartDate: formData.isNewCompany
            ? formData.subscriptionStartDate
            : null,
          subscriptionEndDate: formData.isNewCompany
            ? formData.subscriptionEndDate
            : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push("/");
    } catch (error) {
      setErrors({
        form: error.message || "An error occurred during registration",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-200";
    if (passwordStrength === 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-yellow-500";
    if (passwordStrength === 3) return "bg-blue-500";
    if (passwordStrength === 4) return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength === 1) return "Weak";
    if (passwordStrength === 2) return "Fair";
    if (passwordStrength === 3) return "Good";
    if (passwordStrength === 4) return "Strong";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-green-500 p-3 rounded-full text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 4h12a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" />
              <path d="M12 16v-4" />
              <path d="M8 16v-4" />
              <path d="M16 16v-4" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Join E-Gym
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Create your account to start managing your gym
        </p>

        {errors.form && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm border-l-4 border-red-500">
            {errors.form}
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-600">
              Account Details
            </span>
            <span className="text-sm font-medium text-gray-400">
              Subscription Details
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: currentStep === 1 ? "50%" : "100%" }}
            ></div>
          </div>
        </div>

        <form className="space-y-5">
          {currentStep === 1 ? (
            <>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-10 border ${
                      errors.email
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                    placeholder="your@email.com"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail
                      className={`h-5 w-5 ${
                        errors.email ? "text-red-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">•</span>
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-10 border ${
                      errors.phone
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                    placeholder="+1234567890"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Phone
                      className={`h-5 w-5 ${
                        errors.phone ? "text-red-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">•</span>
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-10 border ${
                      errors.password
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock
                      className={`h-5 w-5 ${
                        errors.password ? "text-red-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {formData.password && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex space-x-1">
                        <div
                          className={`h-2 w-6 rounded-full ${
                            passwordStrength >= 1
                              ? getPasswordStrengthColor()
                              : "bg-gray-200"
                          }`}
                        ></div>
                        <div
                          className={`h-2 w-6 rounded-full ${
                            passwordStrength >= 2
                              ? getPasswordStrengthColor()
                              : "bg-gray-200"
                          }`}
                        ></div>
                        <div
                          className={`h-2 w-6 rounded-full ${
                            passwordStrength >= 3
                              ? getPasswordStrengthColor()
                              : "bg-gray-200"
                          }`}
                        ></div>
                        <div
                          className={`h-2 w-6 rounded-full ${
                            passwordStrength >= 4
                              ? getPasswordStrengthColor()
                              : "bg-gray-200"
                          }`}
                        ></div>
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          passwordStrength === 1
                            ? "text-red-500"
                            : passwordStrength === 2
                            ? "text-yellow-500"
                            : passwordStrength === 3
                            ? "text-blue-500"
                            : passwordStrength === 4
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      >
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                  </div>
                )}

                {errors.password ? (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">•</span>
                    {errors.password}
                  </p>
                ) : (
                  <div className="mt-1 text-xs text-gray-500 flex items-center">
                    <CheckCircle
                      className={`h-4 w-4 mr-1 ${
                        formData.password && formData.password.length >= 8
                          ? "text-green-500"
                          : "text-gray-300"
                      }`}
                    />
                    <span
                      className={
                        formData.password && formData.password.length >= 8
                          ? "text-green-500"
                          : ""
                      }
                    >
                      Minimum 8 characters
                    </span>
                    <CheckCircle
                      className={`h-4 w-4 mx-1 ${
                        formData.password && /[A-Z]/.test(formData.password)
                          ? "text-green-500"
                          : "text-gray-300"
                      }`}
                    />
                    <span
                      className={
                        formData.password && /[A-Z]/.test(formData.password)
                          ? "text-green-500"
                          : ""
                      }
                    >
                      Uppercase
                    </span>
                    <CheckCircle
                      className={`h-4 w-4 mx-1 ${
                        formData.password && /[0-9]/.test(formData.password)
                          ? "text-green-500"
                          : "text-gray-300"
                      }`}
                    />
                    <span
                      className={
                        formData.password && /[0-9]/.test(formData.password)
                          ? "text-green-500"
                          : ""
                      }
                    >
                      Number
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-10 border ${
                      errors.confirmPassword
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock
                      className={`h-5 w-5 ${
                        errors.confirmPassword
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">•</span>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-300 shadow-lg transition flex items-center justify-center"
                disabled={isLoading}
              >
                Continue
                <ChevronDown className="h-5 w-5 ml-1 rotate-270" />
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-10 border ${
                        errors.role
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none`}
                      disabled={isLoading}
                    >
                      <option value="manager">Manager</option>
                      <option value="coach">Coach</option>
                      <option value="superadmin">SuperAdmin</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Users
                        className={`h-5 w-5 ${
                          errors.role ? "text-red-400" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                  )}
                </div>
              </div>

              {formData.role !== "superadmin" && (
                <>
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Company Name
                    </label>
                    <div className="relative">
                      {companies.length > 0 ? (
                        <select
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleCompanyChange}
                          className={`w-full px-4 py-3 pl-10 border ${
                            errors.companyName
                              ? "border-red-300 bg-red-50"
                              : "border-gray-300"
                          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none`}
                          disabled={isLoading}
                        >
                          <option value="">Select a company or add new</option>
                          {companies.map((company) => (
                            <option key={company.id} value={company.name}>
                              {company.name} (Created:{" "}
                              {new Date(company.createdAt).toLocaleDateString()}
                              )
                            </option>
                          ))}
                          <option value="new">Add new company</option>
                        </select>
                      ) : (
                        <input
                          id="newCompanyName"
                          name="newCompanyName"
                          type="text"
                          value={formData.newCompanyName}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 pl-10 border ${
                            errors.companyName
                              ? "border-red-300 bg-red-50"
                              : "border-gray-300"
                          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                          placeholder="Enter your company name"
                          disabled={isLoading}
                        />
                      )}
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Building
                          className={`h-5 w-5 ${
                            errors.companyName
                              ? "text-red-400"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        {companies.length > 0 && (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    {errors.companyName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.companyName}
                      </p>
                    )}
                  </div>

                  {formData.isNewCompany && (
                    <>
                      <div>
                        <label
                          htmlFor="newCompanyName"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          New Company Name
                        </label>
                        <div className="relative">
                          <input
                            id="newCompanyName"
                            name="newCompanyName"
                            type="text"
                            value={formData.newCompanyName}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 pl-10 border ${
                              errors.companyName
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300"
                            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                            placeholder="Enter new company name"
                            disabled={isLoading}
                          />
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Building
                              className={`h-5 w-5 ${
                                errors.companyName
                                  ? "text-red-400"
                                  : "text-gray-400"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="location"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Location (Optional)
                        </label>
                        <div className="relative">
                          <input
                            id="location"
                            name="location"
                            type="text"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Your location"
                            disabled={isLoading}
                          />
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="subscriptionType"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Subscription
                          </label>
                          <div className="relative">
                            <select
                              id="subscriptionType"
                              name="subscriptionType"
                              value={formData.subscriptionType}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 pl-10 border ${
                                errors.subscriptionType
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none`}
                              disabled={isLoading}
                            >
                              <option value="free">
                                Free (21 days, 5 clients, 20 payments)
                              </option>
                              <option value="premium">
                                Premium (50 clients, 100 payments)
                              </option>
                              <option value="enterprise">
                                Enterprise (300 clients, 1000 payments)
                              </option>
                            </select>
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <CreditCard
                                className={`h-5 w-5 ${
                                  errors.subscriptionType
                                    ? "text-red-400"
                                    : "text-gray-400"
                                }`}
                              />
                            </div>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                          {errors.subscriptionType && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.subscriptionType}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="subscriptionStartDate"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Start Date
                          </label>
                          <div className="relative">
                            <input
                              id="subscriptionStartDate"
                              name="subscriptionStartDate"
                              type="date"
                              value={formData.subscriptionStartDate}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 pl-10 border ${
                                errors.subscriptionStartDate
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                              disabled={
                                isLoading ||
                                formData.subscriptionType === "free"
                              }
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <Calendar
                                className={`h-5 w-5 ${
                                  errors.subscriptionStartDate
                                    ? "text-red-400"
                                    : "text-gray-400"
                                }`}
                              />
                            </div>
                          </div>
                          {errors.subscriptionStartDate && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.subscriptionStartDate}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="subscriptionEndDate"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            End Date
                          </label>
                          <div className="relative">
                            <input
                              id="subscriptionEndDate"
                              name="subscriptionEndDate"
                              type="date"
                              value={formData.subscriptionEndDate}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 pl-10 border ${
                                errors.subscriptionEndDate
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                              disabled={
                                isLoading ||
                                formData.subscriptionType === "free"
                              }
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <Calendar
                                className={`h-5 w-5 ${
                                  errors.subscriptionEndDate
                                    ? "text-red-400"
                                    : "text-gray-400"
                                }`}
                              />
                            </div>
                          </div>
                          {errors.subscriptionEndDate && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.subscriptionEndDate}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {!formData.isNewCompany && formData.companyName && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Company Subscription Details
                      </h3>
                      <p className="text-sm text-gray-600">
                        <strong>Subscription Type:</strong>{" "}
                        {formData.subscriptionType.charAt(0).toUpperCase() +
                          formData.subscriptionType.slice(1)}{" "}
                        {formData.subscriptionType === "free" &&
                          "(5 clients, 20 payments)"}
                        {formData.subscriptionType === "premium" &&
                          "(50 clients, 100 payments)"}
                        {formData.subscriptionType === "enterprise" &&
                          "(300 clients, 1000 payments)"}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Start Date:</strong>{" "}
                        {formData.subscriptionStartDate
                          ? new Date(
                              formData.subscriptionStartDate
                            ).toLocaleDateString()
                          : "Not set"}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>End Date:</strong>{" "}
                        {formData.subscriptionEndDate
                          ? new Date(
                              formData.subscriptionEndDate
                            ).toLocaleDateString()
                          : "Not set"}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition flex items-center justify-center"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  onClick={handleRegister}
                  disabled={isLoading}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition flex items-center justify-center shadow-lg ${
                    isLoading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-300"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
