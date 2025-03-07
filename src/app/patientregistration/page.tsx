"use client";

import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { db } from "../../../firebaseconfig"; // Adjust path as needed
import { ref, push, set, get, child } from "firebase/database";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

// Force dynamic rendering so Next.js doesn't try to statically pre-render this page
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
  1. TYPE DEFINITIONS & SAMPLE DATA
------------------------------------------------------------------ */
type OphthalmicItem = {
  name: string;
  rightDuration: string;
  rightDurationUnit: string;
  leftDuration: string;
  leftDurationUnit: string;
  comments: string;
};

type SystemicItem = {
  name: string;
  duration: string;
  durationUnit: string;
  comments: string;
};

type AllergyItem = {
  name: string;
  duration: string;
  durationUnit: string;
  comments: string;
};

type FormData = {
  // Patient Details
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  mobileNumber: string;
  secondaryNumber: string;
  email: string;
  whatsappNumber: string;
  sameAsContact?: boolean;
  gender: string;
  dob: string;
  ageYears: string;
  ageMonths: string;
  relation: string;
  patientType: string;
  pincode: string;
  state: string;
  city: string;
  area: string;
  address1: string;
  address2: string;
  medicalRecordNo: string;
  healthIdNo: string;
  primaryLanguage: string;
  secondaryLanguage: string;
  patientReferralSource: string;

  // Appointment
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  location: string;
  consultant: string;
  consultantFreeze?: boolean;
  visitType: string;

  // Other Details
  patientImage?: string | null;
  bloodGroup: string;
  maritalStatus: string;
  oneEyed: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  aadharNo: string;
  panNo: string;
  dlNo: string;
  gstNo: string;

  // Histories
  ophthalmicHistory: OphthalmicItem[];
  systemicHistory: SystemicItem[];
  medicalHistory: string;
  familyHistory: string;
  pediatricNutritionalStatus: string;
  pediatricComments: string;
  immunizationAssessment: string;

  // Allergies
  drugAllergies: {
    [category: string]: AllergyItem[];
  };
  drugAllergiesComment: string;

  contactAllergies: AllergyItem[];
  contactAllergiesComment: string;

  foodAllergies: AllergyItem[];
  foodAllergiesComment: string;

  otherAllergy: string;
};

const ALL_OPHTHALMIC_NAMES = [
  "Glaucoma",
  "Retinal Detachment",
  "Glass",
  "Eye Disease",
  "Uveitis",
  "Cataract",
  "Retina",
  "Corneal Transplant",
  "LASIK",
  "Pterygium Surgery",
  "Lid Surgery",
  "Oculoplasty",
  "DCR Surgery",
  "Squint",
  "Retinal laser",
  "Contact lens",
];

const ALL_SYSTEMIC_NAMES = [
  "Diabetes",
  "Hypertension",
  "Alcoholism",
  "Smoking Tobacco",
  "Cardiac Disorder",
  "Steroid Intake",
  "Drug Abuse",
  "Hiv Aids",
  "Cancer Tumor",
  "Tuberculosis",
  "Asthma",
  "Cns Disorder Stroke",
  "Hypothyroidism",
  "Hyperthyroidism",
  "Hepatitis Cirrhosis",
  "Renal Disorder",
  "Acidity",
  "On Insulin",
  "On Aspirin Blood Thinners",
  "Consanguinity",
  "Thyroid Disorder",
  "Chewing Tobacco",
  "Chronic Kidney Disease",
  "CVA",
  "Rheumatoid Arthritis",
  "Benign Prostatic Hyperplasia(BPH)",
];

const DRUG_CATEGORIES = [
  {
    category: "Antimicrobial Agents",
    items: [
      "Ampicillin",
      "Amoxicillin",
      "Ceftriaxone",
      "Ciprofloxacin",
      "Clarithromycin",
      "Co Trimoxazole",
      "Ethambutol",
      "Isoniazid",
      "Metronidazole",
      "Penicillin",
      "Rifampicin",
      "Streptomycin",
    ],
  },
  {
    category: "Antifungal Agents",
    items: ["Ketoconazole", "Fluconazole", "Itraconazole"],
  },
  {
    category: "Antiviral Agents",
    items: ["Acyclovir", "Efavirenz", "Enfuvirtide", "Nelfinavir", "Nevi"],
  },
  {
    category: "Nsaids",
    items: [
      "Aspirin",
      "Paracetamol",
      "Ibuprofen",
      "Diclofenac",
      "Aceclofenac",
      "Naproxenrapine",
      "Zidovudine",
    ],
  },
  {
    category: "Eye Drops",
    items: [
      "Tropicamide_P",
      "Tropicamide",
      "Timolol",
      "Homide",
      "Latanoprost",
      "Brimonidine",
      "Travoprost",
      "Tobramycin",
      "Moxifloxacin",
      "Homatropine",
      "Pilocarpine",
      "Cyclopentolate",
      "Atropine",
      "Phenylephrine",
      "Tropicacyl",
      "Paracain",
      "Ciplox",
      "Tropicamide P + Distilled Water",
      "Tropicamide P + Lubrex",
    ],
  },
];

const CONTACT_ALLERGIES_LIST = [
  "Alcohol",
  "Latex",
  "Betadine",
  "Adhesive Tape",
  "Tegaderm",
  "Transpore",
];

const FOOD_ALLERGIES_LIST = [
  "All Seafood",
  "Corn",
  "Egg",
  "Milk Proteins",
  "Peanuts",
  "Shellfish Only",
  "Soy Protein",
  "Lactose",
  "Mushroom",
];

// Default form values
const defaultValues: FormData = {
  // Patient Details
  title: "Mr",
  firstName: "",
  middleName: "",
  lastName: "",
  mobileNumber: "",
  secondaryNumber: "",
  email: "",
  whatsappNumber: "",
  sameAsContact: false,
  gender: "Male",
  dob: "",
  ageYears: "",
  ageMonths: "",
  relation: "",
  patientType: "",
  pincode: "",
  state: "",
  city: "",
  area: "",
  address1: "",
  address2: "",
  medicalRecordNo: "",
  healthIdNo: "",
  primaryLanguage: "",
  secondaryLanguage: "",
  patientReferralSource: "",

  // Appointment
  appointmentType: "Walk-in",
  appointmentDate: "",
  appointmentTime: "",
  location: "ASHU EYE HOSPITAL",
  consultant: "SHAHNAWAZ KAZI",
  consultantFreeze: false,
  visitType: "Review",

  // Other Details
  patientImage: null,
  bloodGroup: "",
  maritalStatus: "Single",
  oneEyed: "No",
  emergencyContactName: "",
  emergencyContactNumber: "",
  aadharNo: "",
  panNo: "",
  dlNo: "",
  gstNo: "",

  // Histories
  ophthalmicHistory: [],
  systemicHistory: [],
  medicalHistory: "",
  familyHistory: "",
  pediatricNutritionalStatus: "",
  pediatricComments: "",
  immunizationAssessment: "",

  // Allergies
  drugAllergies: {
    "Antimicrobial Agents": [],
    "Antifungal Agents": [],
    "Antiviral Agents": [],
    "Nsaids": [],
    "Eye Drops": [],
  },
  drugAllergiesComment: "",
  contactAllergies: [],
  contactAllergiesComment: "",
  foodAllergies: [],
  foodAllergiesComment: "",
  otherAllergy: "",
};

/* ------------------------------------------------------------------
  2. MAIN COMPONENT
------------------------------------------------------------------ */
const PatientRegistration: NextPage = () => {
  const router = useRouter();
  const { register, handleSubmit, reset, watch, setValue } =
    useForm<FormData>({ defaultValues });

  // This will store the current record ID if we detect it in the query string.
  const [recordId, setRecordId] = useState<string | null>(null);

  // We can load the ID from the query string in a client-side useEffect
  useEffect(() => {
    // Make sure window is defined (client-side).
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const idFromQuery = params.get("id");
      if (idFromQuery) {
        setRecordId(idFromQuery);
      }
    }
  }, []);

  // Example clinic ID
  const clinicId = "clinic1";

  // If editing an existing record, fetch it once recordId is set
  useEffect(() => {
    if (!recordId) return;
    get(child(ref(db), `clinic/${clinicId}/patientdetail/${recordId}`))
      .then((snap) => {
        if (snap.exists()) {
          const existingData = snap.val() as FormData;
          reset(existingData);
        } else {
          alert("No record found for id = " + recordId);
        }
      })
      .catch((err) => console.error(err));
  }, [recordId, reset, clinicId]);

  // On form submit
  const onSubmit = async (formValues: FormData) => {
    try {
      if (recordId) {
        // If we have a recordId, we are updating
        await set(
          ref(db, `clinic/${clinicId}/patientdetail/${recordId}`),
          formValues
        );
        alert("Updated existing patient: " + recordId);
      } else {
        // Otherwise, we are creating a new entry
        const newRef = push(ref(db, `clinic/${clinicId}/patientdetail`));
        await set(newRef, formValues);
        alert("New patient created with id: " + newRef.key);
        router.replace("/");
        reset();
      }
    } catch (error) {
      console.error(error);
      alert("Error saving data: " + String(error));
    }
  };

  // Handle photo upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setValue("patientImage", base64, { shouldDirty: true });
      toast.success("Photo loaded!");
    };
    reader.readAsDataURL(file);
  };

  /* ------------------------------------------------------------------
    3. ADVANCED SPEECH COMMANDS
  ------------------------------------------------------------------ */
  // We define commands for each field. Additionally, we define commands
  // for tab navigation, form submission, etc.
  const goToNextTab = () =>
    setTabIndex((prev) => (prev < 3 ? prev + 1 : 3));
  const goToPreviousTab = () =>
    setTabIndex((prev) => (prev > 0 ? prev - 1 : 0));

  // Function to handle the advanced “ophthalmic select” command
  const handleOphthalmicSelect = (
    name: string,
    rDur: string,
    rUnit: string,
    lDur: string,
    lUnit: string
  ) => {
    // 1. Check if 'name' is already in the array; if not, add it
    const ophArr = watch("ophthalmicHistory") || [];
    const newArr = [...ophArr];
    let idx = newArr.findIndex((x) => x.name.toLowerCase() === name.toLowerCase());
    if (idx === -1) {
      // Add the item
      newArr.push({
        name,
        rightDuration: "",
        rightDurationUnit: "",
        leftDuration: "",
        leftDurationUnit: "",
        comments: "",
      });
      idx = newArr.length - 1;
    }

    // 2. Set right duration and unit
    newArr[idx] = {
      ...newArr[idx],
      rightDuration: rDur,
      rightDurationUnit: convertUnit(rUnit), // Helper function below
      leftDuration: lDur,
      leftDurationUnit: convertUnit(lUnit),
    };

    setValue("ophthalmicHistory", newArr, { shouldDirty: true });
    toast.success(
      `Ophthalmic: ${name} (R: ${rDur} ${rUnit}, L: ${lDur} ${lUnit}) updated.`
    );
  };

  // Quick helper to handle singular/plural: “month”/“months” -> “Months”, etc.
  const convertUnit = (raw: string) => {
    // just make sure we store either "Days", "Months", or "Years"
    const lower = raw.toLowerCase();
    if (lower.startsWith("day")) return "Days";
    if (lower.startsWith("month")) return "Months";
    if (lower.startsWith("year")) return "Years";
    return ""; // fallback
  };

  const voiceCommands = [
    // -----------------------------
    // PATIENT DETAILS FIELDS
    // -----------------------------
    {
      // e.g. "first name John"
      command: /first name (.*)/i,
      callback: (value: string) => {
        setValue("firstName", value.trim(), { shouldValidate: true });
        toast.info("First Name set to: " + value);
      },
    },
    {
        // e.g. "first name John"
        command: /middle name (.*)/i,
        callback: (value: string) => {
          setValue("middleName", value.trim(), { shouldValidate: true });
          toast.info("First Name set to: " + value);
        },
      },
    {
      command: /last name (.*)/i,
      callback: (value: string) => {
        setValue("lastName", value.trim(), { shouldValidate: true });
        toast.info("Last Name set to: " + value);
      },
    },
    {
      command: /mobile number (.*)/i,
      callback: (value: string) => {
        // remove non-digits
        const sanitized = value.replace(/\D/g, "");
        setValue("mobileNumber", sanitized, { shouldValidate: true });
        toast.info("Mobile Number set to: " + sanitized);
      },
    },
    {
        command: /second number (.*)/i,
        callback: (value: string) => {
          // remove non-digits
          const sanitized = value.replace(/\D/g, "");
          setValue("secondaryNumber", sanitized, { shouldValidate: true });
          toast.info("Mobile Number set to: " + sanitized);
        },
      },
    {
      // e.g. "email john doe at example dot com"
      // We’ll at least remove spaces. The user can correct the domain as needed
      command: /email (.*)/i,
      callback: (rawEmail: string) => {
        const sanitized = rawEmail.replaceAll(" ", "");
        setValue("email", sanitized, { shouldValidate: true });
        toast.info("Email set to: " + sanitized);
      },
    },
    {
      command: /whatsapp number (.*)/i,
      callback: (value: string) => {
        const sanitized = value.replace(/\D/g, "");
        setValue("whatsappNumber", sanitized, { shouldValidate: true });
        toast.info("WhatsApp Number set to: " + sanitized);
      },
    },
    {
        command: /pincode (.*)/i,
        callback: (value: string) => {
          const sanitized = value.replace(/\D/g, "");
          setValue("pincode", sanitized, { shouldValidate: true });
          toast.info("pincode set to: " + sanitized);
        },
      },
      {
        command: /state (.*)/i,
        callback: (value: string) => {
          const sanitized = value.replace(/\D/g, "");
          setValue("state", sanitized, { shouldValidate: true });
          toast.info("state set to: " + sanitized);
        },
      },
      {
        command: /address (.*)/i,
        callback: (value: string) => {
          const sanitized = value.replace(/\D/g, "");
          setValue("address1", sanitized, { shouldValidate: true });
          toast.info("address1 set to: " + sanitized);
        },
      },
      {
        command: /primary language (.*)/i,
        callback: (value: string) => {
          const sanitized = value.replace(/\D/g, "");
          setValue("primaryLanguage", sanitized, { shouldValidate: true });
          toast.info("primary language set to: " + sanitized);
        },
      },
      {
        command: /secondary language (.*)/i,
        callback: (value: string) => {
          const sanitized = value.replace(/\D/g, "");
          setValue("secondaryLanguage", sanitized, { shouldValidate: true });
          toast.info("secondary language set to: " + sanitized);
        },
      },
      {
        command: /refer (.*)/i,
        callback: (value: string) => {
          const sanitized = value.replace(/\D/g, "");
          setValue("patientReferralSource", sanitized, { shouldValidate: true });
          toast.info("patientReferralSource set to: " + sanitized);
        },
      },
    {
      command: /dob (.*)/i,
      callback: (value: string) => {
        // e.g. "dob 2000-01-15" or "dob 2000 dash 01 dash 15"
        // up to you how fancy you want to parse
        const sanitized = value.replace(/ dash /g, "-").replace(/ /g, "");
        setValue("dob", sanitized, { shouldValidate: true });
        toast.info("DOB set to: " + sanitized);
      },
    },
    {
      command: /appointment date (.*)/i,
      callback: (value: string) => {
        const sanitized = value.replace(/ dash /g, "-").replace(/ /g, "");
        setValue("appointmentDate", sanitized, { shouldValidate: true });
        toast.info("Appointment Date set to: " + sanitized);
      },
    },
    {
      command: /appointment time (.*)/i,
      callback: (value: string) => {
        // e.g. "appointment time 09 colon 30"
        const sanitized = value
          .replace(/ colon /g, ":")
          .replace(/ /g, ""); // remove spaces
        setValue("appointmentTime", sanitized, { shouldValidate: true });
        toast.info("Appointment Time set to: " + sanitized);
      },
    },

    // -----------------------------
    // NAVIGATION BETWEEN TABS
    // -----------------------------
    {
      command: "patient details",
      callback: () => {
        setTabIndex(0);
        toast.info("Switched to Patient Details tab.");
      },
    },
    {
      command: "other details",
      callback: () => {
        setTabIndex(1);
        toast.info("Switched to Other Details tab.");
      },
    },
    {
      command: "history",
      callback: () => {
        setTabIndex(2);
        toast.info("Switched to History tab.");
      },
    },
    {
      command: "allergies",
      callback: () => {
        setTabIndex(3);
        toast.info("Switched to Allergies tab.");
      },
    },
    {
      // user can say "next tab" to jump forward
      command: "next",
      callback: () => {
        goToNextTab();
        toast.info("Moved to next tab.");
      },
    },
    {
      // user can say "previous tab" to jump back
      command: "back",
      callback: () => {
        goToPreviousTab();
        toast.info("Moved to previous tab.");
      },
    },

    // -----------------------------
    // OPHTHALMIC COMMAND (ADVANCED)
    // e.g. "ophthalmic select Glass right duration 5 months left duration 3 months"
    // or "ophthalmic select Cataract right duration 2 day left duration 3 days"
    // -----------------------------
    {
      command:
        /ophthalmic select ([a-zA-Z ]+) right duration (\d+) (days|day|months|month|years|year) left duration (\d+) (days|day|months|month|years|year)/i,
      callback: (
        conditionName: string,
        rValue: string,
        rUnit: string,
        lValue: string,
        lUnit: string
      ) => {
        handleOphthalmicSelect(conditionName, rValue, rUnit, lValue, lUnit);
      },
    },

    // -----------------------------
    // SAVE, BACK
    // -----------------------------
    {
      // e.g. "submit" or "save form"
      command: /(submit|save form)/i,
      callback: () => {
        handleSubmit(onSubmit)();
      },
    },
    {
      // e.g. "back" or "go back"
      command: /(back|go back)/i,
      callback: () => {
        router.back();
      },
    },
  ];

  // The below is from react-speech-recognition
  const {
    transcript,
    resetTranscript,
    listening: micListening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition({ commands: voiceCommands });

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      toast.error("Browser does not support speech recognition.");
    }
  }, [browserSupportsSpeechRecognition]);

  const toggleListening = () => {
    if (micListening) {
      SpeechRecognition.stopListening();
      toast.info("Voice recognition stopped.");
    } else {
      if (browserSupportsSpeechRecognition) {
        SpeechRecognition.startListening({ continuous: true });
        toast.info("Voice recognition started.");
      } else {
        toast.error("Browser does not support speech recognition.");
      }
    }
  };

  /* ------------------------------------------------------------------
    4. TAB HANDLING
  ------------------------------------------------------------------ */
  const [tabIndex, setTabIndex] = useState(0);

  const renderTabButtons = () => (
    <div className="flex gap-4 border-b mb-4 pb-2 text-black">
      {["Patient Details", "Other Details", "History", "Allergies"].map(
        (label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => setTabIndex(idx)}
            className={
              tabIndex === idx
                ? "font-bold border-b-2 border-blue-600 text-black"
                : "text-black"
            }
          >
            {label}
          </button>
        )
      )}
    </div>
  );

  /* ------------------------------------------------------------------
    5. RENDER PATIENT DETAILS TAB
  ------------------------------------------------------------------ */
  const renderPatientDetailsTab = () => (
    <div className="flex flex-col md:flex-row gap-4 text-black">
      {/* Left side: Patient Info */}
      <div className="flex-1 p-4 bg-white shadow rounded space-y-4">
        {/* Title, First Name, Middle Name, Last Name */}
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="text-black">Title</label>
            <select
              {...register("title")}
              className="border rounded p-1 w-full text-black"
            >
              <option>Mr</option>
              <option>Mrs</option>
              <option>Ms</option>
              <option>Dr</option>
            </select>
          </div>
          <div>
            <label className="text-black">First Name*</label>
            <input
              {...register("firstName", { required: true })}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Middle Name</label>
            <input
              {...register("middleName")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Last Name</label>
            <input
              {...register("lastName")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
        </div>

        {/* Mobile, Secondary */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-black">Mobile Number*</label>
            <input
              {...register("mobileNumber", { required: true })}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Second Number</label>
            <input
              {...register("secondaryNumber")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
        </div>

        {/* Email, WhatsApp */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-black">Email</label>
            <input
              {...register("email")}
              type="email"
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">WhatsApp Number</label>
            <input
              {...register("whatsappNumber")}
              className="border rounded p-1 w-full text-black"
            />
            <div>
              <label className="text-black">
                <input type="checkbox" {...register("sameAsContact")} /> Same as
                contact number
              </label>
            </div>
          </div>
        </div>

        {/* Gender, DOB, Age, Relation */}
        <div className="grid grid-cols-5 gap-2">
          <div>
            <label className="text-black">Gender</label>
            <div>
              {["Male", "Female", "Transgender"].map((g) => (
                <label key={g} className="mr-2 text-black">
                  <input type="radio" value={g} {...register("gender")} />
                  {g}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-black">DOB</label>
            <input
              type="date"
              {...register("dob")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Age (Years)</label>
            <input
              {...register("ageYears")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Age (Months)</label>
            <input
              {...register("ageMonths")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Relation</label>
            <select
              {...register("relation")}
              className="border rounded p-1 w-full text-black"
            >
              <option value="">Select</option>
              <option>Self</option>
              <option>Parent</option>
              <option>Spouse</option>
              <option>Child</option>
            </select>
          </div>
        </div>

        {/* Patient Type, Pincode, State */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-black">Patient Type</label>
            <select
              {...register("patientType")}
              className="border rounded p-1 w-full text-black"
            >
              <option value="">Select</option>
              <option>New</option>
              <option>Old</option>
            </select>
          </div>
          <div>
            <label className="text-black">Pincode</label>
            <input
              {...register("pincode")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">State</label>
            <input
              {...register("state")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
        </div>

        {/* City, Area, Address1 */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-black">City</label>
            <input
              {...register("city")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Select Area</label>
            <input
              {...register("area")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Address 1</label>
            <input
              {...register("address1")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
        </div>

        {/* Address2, MRNo, HealthID */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-black">Address 2</label>
            <input
              {...register("address2")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Medical Record No</label>
            <input
              {...register("medicalRecordNo")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Health ID No</label>
            <input
              {...register("healthIdNo")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
        </div>

        {/* Languages, referral */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-black">Primary Language</label>
            <input
              {...register("primaryLanguage")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Secondary Language</label>
            <input
              {...register("secondaryLanguage")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Patient Referral Source</label>
            <input
              {...register("patientReferralSource")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
        </div>
      </div>

      {/* Right side: Appointment */}
      <div className="md:w-1/3 p-4 bg-white shadow rounded space-y-4 text-black">
        <h3 className="font-bold text-black">Appointment Details</h3>
        <div>
          <label className="text-black">Type</label>
          <div>
            <label className="mr-4 text-black">
              <input
                type="radio"
                value="Walk-in"
                {...register("appointmentType")}
              />
              Walk-in
            </label>
            <label className="text-black">
              <input
                type="radio"
                value="Appointment"
                {...register("appointmentType")}
              />
              Appointment
            </label>
          </div>
        </div>
        <div>
          <label className="text-black">Date &amp; Time</label>
          <div className="flex gap-2">
            <input
              type="date"
              {...register("appointmentDate")}
              className="border rounded p-1 text-black"
            />
            <input
              type="time"
              {...register("appointmentTime")}
              className="border rounded p-1 text-black"
            />
          </div>
        </div>
        <div>
          <label className="text-black">Location</label>
          <input
            {...register("location")}
            className="border rounded p-1 w-full text-black"
          />
        </div>
        <div>
          <label className="text-black">Consultant</label>
          <input
            {...register("consultant")}
            className="border rounded p-1 w-full text-black"
          />
          <div>
            <label className="text-black">
              <input type="checkbox" {...register("consultantFreeze")} /> Freeze
            </label>
          </div>
        </div>
        <div>
          <label className="text-black">Visit Type</label>
          <select
            {...register("visitType")}
            className="border rounded p-1 w-full text-black"
          >
            <option>Review</option>
            <option>New</option>
            <option>Follow-up</option>
          </select>
        </div>
        <div>
          <h4 className="text-black">
            Reserved Slot for {watch("appointmentDate") || "DD-MM-YYYY"}
          </h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Demo of reserved vs free slots */}
            {["03:08", "03:09", "03:34", "04:00", "06:15"].map((slot) => (
              <span
                key={slot}
                className="bg-red-500 text-white px-2 py-1 text-xs rounded"
              >
                {slot}
              </span>
            ))}
            {["05:00", "07:00", "08:00", "09:00", "10:00"].map((slot) => (
              <span
                key={slot}
                className="bg-blue-500 text-white px-2 py-1 text-xs rounded"
              >
                {slot}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------
    6. RENDER OTHER DETAILS TAB
  ------------------------------------------------------------------ */
  const renderOtherDetailsTab = () => {
    const currentImg = watch("patientImage");
    return (
      <div className="bg-white p-4 rounded shadow space-y-4 text-black">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label className="font-semibold text-black">Patient Image</label>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
              />
            </div>
            <div className="w-24 h-24 border mt-2 flex items-center justify-center text-xs text-gray-400">
              {currentImg ? (
                <img
                  src={currentImg}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                "No Image"
              )}
            </div>
          </div>
          <div>
            <label className="font-semibold text-black">Blood Group</label>
            <div className="flex flex-wrap gap-3 mt-2">
              {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((bg) => (
                <label key={bg} className="text-black">
                  <input type="radio" value={bg} {...register("bloodGroup")} />
                  {bg}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="font-semibold text-black">Marital Status</label>
            <div>
              <label className="mr-4 text-black">
                <input
                  type="radio"
                  value="Single"
                  {...register("maritalStatus")}
                />
                Single
              </label>
              <label className="text-black">
                <input
                  type="radio"
                  value="Married"
                  {...register("maritalStatus")}
                />
                Married
              </label>
            </div>
          </div>
          <div>
            <label className="font-semibold text-black">One Eyed</label>
            <div>
              <label className="mr-4 text-black">
                <input type="radio" value="Yes" {...register("oneEyed")} />
                Yes
              </label>
              <label className="text-black">
                <input type="radio" value="No" {...register("oneEyed")} />
                No
              </label>
            </div>
          </div>
          <div>
            <label className="font-semibold text-black">
              Emergency Contact
            </label>
            <div className="flex gap-2">
              <input
                placeholder="Name"
                {...register("emergencyContactName")}
                className="border rounded p-1 w-1/2 text-black"
              />
              <input
                placeholder="Number"
                {...register("emergencyContactNumber")}
                className="border rounded p-1 w-1/2 text-black"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-black">Aadhar Card No.</label>
            <input
              {...register("aadharNo")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">PAN Card No.</label>
            <input
              {...register("panNo")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">DL No.</label>
            <input
              {...register("dlNo")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">GST No.</label>
            <input
              {...register("gstNo")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------
    7. RENDER HISTORY TAB (OPHTHALMIC + SYSTEMIC + PEDIATRIC)
  ------------------------------------------------------------------ */
  const renderHistoryTab = () => {
    const ophArr = watch("ophthalmicHistory") || [];
    const sysArr = watch("systemicHistory") || [];

    // Toggle an ophthalmic condition
    const toggleOph = (name: string) => {
      const idx = ophArr.findIndex((x) => x.name === name);
      if (idx >= 0) {
        const newArr = [...ophArr];
        newArr.splice(idx, 1);
        setValue("ophthalmicHistory", newArr, { shouldDirty: true });
      } else {
        const newItem: OphthalmicItem = {
          name,
          rightDuration: "",
          rightDurationUnit: "",
          leftDuration: "",
          leftDurationUnit: "",
          comments: "",
        };
        setValue("ophthalmicHistory", [...ophArr, newItem], {
          shouldDirty: true,
        });
      }
    };

    const updateOphField = (
      name: string,
      field: keyof OphthalmicItem,
      value: string
    ) => {
      const newArr = [...ophArr];
      const idx = newArr.findIndex((x) => x.name === name);
      if (idx >= 0) {
        newArr[idx] = { ...newArr[idx], [field]: value };
        setValue("ophthalmicHistory", newArr, { shouldDirty: true });
      }
    };

    const copyRightToLeft = (name: string) => {
      const newArr = [...ophArr];
      const idx = newArr.findIndex((x) => x.name === name);
      if (idx >= 0) {
        newArr[idx].leftDuration = newArr[idx].rightDuration;
        newArr[idx].leftDurationUnit = newArr[idx].rightDurationUnit;
        setValue("ophthalmicHistory", newArr, { shouldDirty: true });
      }
    };

    // Toggle a systemic condition
    const toggleSys = (name: string) => {
      const idx = sysArr.findIndex((x) => x.name === name);
      if (idx >= 0) {
        const newArr = [...sysArr];
        newArr.splice(idx, 1);
        setValue("systemicHistory", newArr, { shouldDirty: true });
      } else {
        const newItem: SystemicItem = {
          name,
          duration: "",
          durationUnit: "",
          comments: "",
        };
        setValue("systemicHistory", [...sysArr, newItem], {
          shouldDirty: true,
        });
      }
    };

    const updateSysField = (
      name: string,
      field: keyof SystemicItem,
      value: string
    ) => {
      const newArr = [...sysArr];
      const idx = newArr.findIndex((x) => x.name === name);
      if (idx >= 0) {
        newArr[idx] = { ...newArr[idx], [field]: value };
        setValue("systemicHistory", newArr, { shouldDirty: true });
      }
    };

    return (
      <div className="bg-white p-4 rounded shadow space-y-4 text-black">
        {/* Ophthalmic */}
        <div>
          <h3 className="font-semibold text-black">Ophthalmic History</h3>
          <div className="flex flex-wrap gap-4 mb-2 mt-2">
            {ALL_OPHTHALMIC_NAMES.map((name) => {
              const isSelected = !!ophArr.find((x) => x.name === name);
              return (
                <label key={name} className="text-black">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOph(name)}
                  />
                  {name}
                </label>
              );
            })}
          </div>
          {ophArr.length > 0 && (
            <div className="overflow-auto">
              <table className="min-w-full text-black border">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-2 border-r">Name</th>
                    <th className="p-2 border-r">Right Duration</th>
                    <th className="p-2 border-r">Right Duration Unit</th>
                    <th className="p-2 border-r">Copy</th>
                    <th className="p-2 border-r">Left Duration</th>
                    <th className="p-2 border-r">Left Duration Unit</th>
                    <th className="p-2">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {ophArr.map((item) => (
                    <tr key={item.name} className="border-b">
                      <td className="p-2 border-r">{item.name}</td>
                      <td className="p-2 border-r">
                        <select
                          className="border p-1"
                          value={item.rightDuration}
                          onChange={(e) =>
                            updateOphField(item.name, "rightDuration", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          <option>1</option>
                          <option>2</option>
                          <option>5</option>
                          <option>10</option>
                        </select>
                      </td>
                      <td className="p-2 border-r">
                        <select
                          className="border p-1"
                          value={item.rightDurationUnit}
                          onChange={(e) =>
                            updateOphField(
                              item.name,
                              "rightDurationUnit",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select</option>
                          <option>Days</option>
                          <option>Months</option>
                          <option>Years</option>
                        </select>
                      </td>
                      <td className="p-2 border-r">
                        <button
                          type="button"
                          className="text-blue-600 underline"
                          onClick={() => copyRightToLeft(item.name)}
                        >
                          &rarr;
                        </button>
                      </td>
                      <td className="p-2 border-r">
                        <select
                          className="border p-1"
                          value={item.leftDuration}
                          onChange={(e) =>
                            updateOphField(item.name, "leftDuration", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          <option>1</option>
                          <option>2</option>
                          <option>5</option>
                          <option>10</option>
                        </select>
                      </td>
                      <td className="p-2 border-r">
                        <select
                          className="border p-1"
                          value={item.leftDurationUnit}
                          onChange={(e) =>
                            updateOphField(
                              item.name,
                              "leftDurationUnit",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select</option>
                          <option>Days</option>
                          <option>Months</option>
                          <option>Years</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className="border p-1 w-full"
                          value={item.comments}
                          onChange={(e) =>
                            updateOphField(item.name, "comments", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Systemic */}
        <div>
          <h3 className="font-semibold text-black">Systemic History</h3>
          <div className="flex flex-wrap gap-4 mb-2 mt-2">
            {ALL_SYSTEMIC_NAMES.map((name) => {
              const isSelected = !!sysArr.find((x) => x.name === name);
              return (
                <label key={name} className="text-black">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSys(name)}
                  />
                  {name}
                </label>
              );
            })}
          </div>
          {sysArr.length > 0 && (
            <div className="overflow-auto">
              <table className="min-w-full text-black border">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-2 border-r">Name</th>
                    <th className="p-2 border-r">Duration</th>
                    <th className="p-2 border-r">Duration Unit</th>
                    <th className="p-2">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {sysArr.map((item) => (
                    <tr key={item.name} className="border-b">
                      <td className="p-2 border-r">{item.name}</td>
                      <td className="p-2 border-r">
                        <select
                          className="border p-1"
                          value={item.duration}
                          onChange={(e) =>
                            updateSysField(item.name, "duration", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          <option>1</option>
                          <option>2</option>
                          <option>5</option>
                          <option>10</option>
                        </select>
                      </td>
                      <td className="p-2 border-r">
                        <select
                          className="border p-1"
                          value={item.durationUnit}
                          onChange={(e) =>
                            updateSysField(
                              item.name,
                              "durationUnit",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select</option>
                          <option>Days</option>
                          <option>Months</option>
                          <option>Years</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className="border p-1 w-full"
                          value={item.comments}
                          onChange={(e) =>
                            updateSysField(item.name, "comments", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Additional text fields */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-black">Medical History</label>
            <input
              {...register("medicalHistory")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Family History</label>
            <input
              {...register("familyHistory")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
        </div>

        {/* Pediatric */}
        <div className="mt-4">
          <h3 className="font-semibold text-black">Pediatric History</h3>
          <div className="flex gap-4 mt-2">
            {["Malnourished", "Well Nourished", "Overweight", "Obese"].map(
              (status) => (
                <label key={status} className="text-black">
                  <input
                    type="radio"
                    value={status}
                    checked={watch("pediatricNutritionalStatus") === status}
                    onChange={() =>
                      setValue("pediatricNutritionalStatus", status, {
                        shouldDirty: true,
                      })
                    }
                  />
                  {status}
                </label>
              )
            )}
          </div>
          <input
            placeholder="Comments"
            {...register("pediatricComments")}
            className="border rounded p-1 w-full mt-2 text-black"
          />
          <div className="mt-2">
            <label className="text-black">Immunization Assessment</label>
            <div className="flex gap-4">
              <label className="text-black">
                <input
                  type="radio"
                  value="Complete"
                  checked={watch("immunizationAssessment") === "Complete"}
                  onChange={() =>
                    setValue("immunizationAssessment", "Complete", {
                      shouldDirty: true,
                    })
                  }
                />
                Complete
              </label>
              <label className="text-black">
                <input
                  type="radio"
                  value="Pending"
                  checked={watch("immunizationAssessment") === "Pending"}
                  onChange={() =>
                    setValue("immunizationAssessment", "Pending", {
                      shouldDirty: true,
                    })
                  }
                />
                Pending
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------
    8. RENDER ALLERGIES TAB
  ------------------------------------------------------------------ */
  const [activeDrugCategory, setActiveDrugCategory] = useState<string>(
    DRUG_CATEGORIES[0].category
  );

  const toggleDrugItem = (category: string, itemName: string) => {
    const drugAllergies = watch("drugAllergies");
    const categoryList = drugAllergies[category] || [];
    const idx = categoryList.findIndex((x) => x.name === itemName);
    if (idx >= 0) {
      const newArr = [...categoryList];
      newArr.splice(idx, 1);
      setValue(`drugAllergies.${category}`, newArr, { shouldDirty: true });
    } else {
      const newItem: AllergyItem = {
        name: itemName,
        duration: "",
        durationUnit: "",
        comments: "",
      };
      setValue(`drugAllergies.${category}`, [...categoryList, newItem], {
        shouldDirty: true,
      });
    }
  };

  const updateDrugField = (
    category: string,
    itemName: string,
    field: keyof AllergyItem,
    value: string
  ) => {
    const drugAllergies = watch("drugAllergies");
    const categoryList = drugAllergies[category] || [];
    const idx = categoryList.findIndex((x) => x.name === itemName);
    if (idx >= 0) {
      const newArr = [...categoryList];
      newArr[idx] = { ...newArr[idx], [field]: value };
      setValue(`drugAllergies.${category}`, newArr, {
        shouldDirty: true,
      });
    }
  };

  // Contact allergies
  const contactArr = watch("contactAllergies") || [];
  const toggleContact = (itemName: string) => {
    const idx = contactArr.findIndex((x: AllergyItem) => x.name === itemName);
    if (idx >= 0) {
      const newArr = [...contactArr];
      newArr.splice(idx, 1);
      setValue("contactAllergies", newArr, { shouldDirty: true });
    } else {
      const newItem: AllergyItem = {
        name: itemName,
        duration: "",
        durationUnit: "",
        comments: "",
      };
      setValue("contactAllergies", [...contactArr, newItem], {
        shouldDirty: true,
      });
    }
  };

  const updateContactField = (
    itemName: string,
    field: keyof AllergyItem,
    value: string
  ) => {
    const newArr = [...contactArr];
    const idx = newArr.findIndex((x) => x.name === itemName);
    if (idx >= 0) {
      newArr[idx] = { ...newArr[idx], [field]: value };
      setValue("contactAllergies", newArr, { shouldDirty: true });
    }
  };

  // Food allergies
  const foodArr = watch("foodAllergies") || [];
  const toggleFood = (itemName: string) => {
    const idx = foodArr.findIndex((x: AllergyItem) => x.name === itemName);
    if (idx >= 0) {
      const newArr = [...foodArr];
      newArr.splice(idx, 1);
      setValue("foodAllergies", newArr, { shouldDirty: true });
    } else {
      const newItem: AllergyItem = {
        name: itemName,
        duration: "",
        durationUnit: "",
        comments: "",
      };
      setValue("foodAllergies", [...foodArr, newItem], {
        shouldDirty: true,
      });
    }
  };

  const updateFoodField = (
    itemName: string,
    field: keyof AllergyItem,
    value: string
  ) => {
    const newArr = [...foodArr];
    const idx = newArr.findIndex((x) => x.name === itemName);
    if (idx >= 0) {
      newArr[idx] = { ...newArr[idx], [field]: value };
      setValue("foodAllergies", newArr, { shouldDirty: true });
    }
  };

  const renderAllergiesTab = () => {
    const drugAllergies = watch("drugAllergies");
    const activeList = drugAllergies[activeDrugCategory] || [];

    return (
      <div className="bg-white p-4 rounded shadow space-y-4 text-black">
        {/* DRUG ALLERGIES */}
        <div>
          <h3 className="font-semibold text-black mb-2">Drug (Allergies)</h3>
          {/* Category tabs */}
          <div className="flex gap-2 mb-2">
            {DRUG_CATEGORIES.map((cat) => (
              <button
                key={cat.category}
                type="button"
                onClick={() => setActiveDrugCategory(cat.category)}
                className={
                  cat.category === activeDrugCategory
                    ? "px-2 py-1 bg-blue-500 text-white rounded"
                    : "px-2 py-1 bg-gray-200 text-black rounded"
                }
              >
                {cat.category}
              </button>
            ))}
          </div>

          {/* Pills for the current category */}
          <div className="flex flex-wrap gap-2 mb-2">
            {DRUG_CATEGORIES.find((c) => c.category === activeDrugCategory)?.items.map(
              (itemName) => {
                const selected = !!activeList.find((x) => x.name === itemName);
                return (
                  <button
                    key={itemName}
                    type="button"
                    onClick={() => toggleDrugItem(activeDrugCategory, itemName)}
                    className={
                      selected
                        ? "px-2 py-1 bg-blue-500 text-white rounded"
                        : "px-2 py-1 bg-gray-200 text-black rounded"
                    }
                  >
                    {itemName}
                  </button>
                );
              }
            )}
          </div>

          {/* Table of selected items */}
          {activeList.length > 0 && (
            <div className="overflow-auto">
              <table className="min-w-full text-black border">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-2 border-r">Name</th>
                    <th className="p-2 border-r">Duration</th>
                    <th className="p-2 border-r">Duration Units</th>
                    <th className="p-2">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {activeList.map((drug) => (
                    <tr key={drug.name} className="border-b">
                      <td className="p-2 border-r">{drug.name}</td>
                      <td className="p-2 border-r">
                        <select
                          className="border p-1"
                          value={drug.duration}
                          onChange={(e) =>
                            updateDrugField(
                              activeDrugCategory,
                              drug.name,
                              "duration",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Please Select</option>
                          <option>1</option>
                          <option>2</option>
                          <option>5</option>
                          <option>10</option>
                        </select>
                      </td>
                      <td className="p-2 border-r">
                        <select
                          className="border p-1"
                          value={drug.durationUnit}
                          onChange={(e) =>
                            updateDrugField(
                              activeDrugCategory,
                              drug.name,
                              "durationUnit",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Please Select</option>
                          <option>Days</option>
                          <option>Months</option>
                          <option>Years</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className="border p-1 w-full"
                          value={drug.comments}
                          onChange={(e) =>
                            updateDrugField(
                              activeDrugCategory,
                              drug.name,
                              "comments",
                              e.target.value
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Overall comment for drug allergies */}
          <textarea
            placeholder="Drug Allergies Comment"
            {...register("drugAllergiesComment")}
            className="w-full border rounded p-1 mt-2 text-black"
          />
        </div>

        {/* CONTACT ALLERGIES */}
        <div>
          <h3 className="font-semibold text-black mb-2">Contact (Allergies)</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {CONTACT_ALLERGIES_LIST.map((name) => {
              const selected = !!contactArr.find((x) => x.name === name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleContact(name)}
                  className={
                    selected
                      ? "px-2 py-1 bg-blue-500 text-white rounded"
                      : "px-2 py-1 bg-gray-200 text-black rounded"
                  }
                >
                  {name}
                </button>
              );
            })}
          </div>
          {contactArr.length > 0 && (
            <div className="overflow-auto">
              <table className="min-w-full text-black border">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-2 border-r">Name</th>
                    <th className="p-2 border-r">Duration</th>
                    <th className="p-2 border-r">Duration Units</th>
                    <th className="p-2">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {contactArr.map((item) => (
                    <tr key={item.name} className="border-b">
                      <td className="p-2 border-r">{item.name}</td>
                      <td className="p-2 border-r">
                        <select
                          className="border p-1"
                          value={item.duration}
                          onChange={(e) =>
                            updateContactField(item.name, "duration", e.target.value)
                          }
                        >
                          <option value="">Please Select</option>
                          <option>1</option>
                          <option>2</option>
                          <option>5</option>
                          <option>10</option>
                        </select>
                      </td>
                      <td className="p-2 border-r">
                        <select
                          className="border p-1"
                          value={item.durationUnit}
                          onChange={(e) =>
                            updateContactField(
                              item.name,
                              "durationUnit",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Please Select</option>
                          <option>Days</option>
                          <option>Months</option>
                          <option>Years</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className="border p-1 w-full"
                          value={item.comments}
                          onChange={(e) =>
                            updateContactField(item.name, "comments", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <textarea
            placeholder="Contact Allergies Comment"
            {...register("contactAllergiesComment")}
            className="w-full border rounded p-1 mt-2 text-black"
          />
        </div>

        {/* FOOD ALLERGIES */}
        <div>
          <h3 className="font-semibold text-black mb-2">Food (Allergies)</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {FOOD_ALLERGIES_LIST.map((name) => {
              const selected = !!foodArr.find((x) => x.name === name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleFood(name)}
                  className={
                    selected
                      ? "px-2 py-1 bg-blue-500 text-white rounded"
                      : "px-2 py-1 bg-gray-200 text-black rounded"
                  }
                >
                  {name}
                </button>
              );
            })}
          </div>
          {foodArr.length > 0 && (
            <div className="overflow-auto">
              <table className="min-w-full text-black border">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-2 border-r">Name</th>
                    <th className="p-2 border-r">Duration</th>
                    <th className="p-2 border-r">Duration Units</th>
                    <th className="p-2">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {foodArr.map((item) => (
                    <tr key={item.name} className="border-b">
                      <td className="p-2 border-r">{item.name}</td>
                      <td className="p-2 border-r">
                        <select
                          className="border p-1"
                          value={item.duration}
                          onChange={(e) =>
                            updateFoodField(item.name, "duration", e.target.value)
                          }
                        >
                          <option value="">Please Select</option>
                          <option>1</option>
                          <option>2</option>
                          <option>5</option>
                          <option>10</option>
                        </select>
                      </td>
                      <td className="p-2 border-r">
                        <select
                          className="border p-1"
                          value={item.durationUnit}
                          onChange={(e) =>
                            updateFoodField(
                              item.name,
                              "durationUnit",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Please Select</option>
                          <option>Days</option>
                          <option>Months</option>
                          <option>Years</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className="border p-1 w-full"
                          value={item.comments}
                          onChange={(e) =>
                            updateFoodField(item.name, "comments", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <textarea
            placeholder="Food Allergies Comment"
            {...register("foodAllergiesComment")}
            className="w-full border rounded p-1 mt-2 text-black"
          />
        </div>

        {/* Other Allergy */}
        <div>
          <label className="font-semibold text-black">Other Allergy</label>
          <input
            {...register("otherAllergy")}
            placeholder="Any other allergy"
            className="border rounded p-1 w-full text-black mt-1"
          />
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------
    9. MAIN RENDER
  ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gray-100 p-4 text-black">
      <ToastContainer />

      {/* Voice Control UI */}
      <div className="max-w-screen-lg mx-auto mb-4 p-4 bg-white rounded shadow text-black">
        <div className="flex justify-center mb-4 space-x-4">
          <button
            onClick={toggleListening}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {micListening ? (
              <FaMicrophoneSlash className="mr-2" />
            ) : (
              <FaMicrophone className="mr-2" />
            )}
            {micListening ? "Stop Listening" : "Start Voice Control"}
          </button>
          <button
            onClick={() => {
              resetTranscript();
              toast.info("Transcript cleared.");
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Reset Transcript
          </button>
        </div>

        {micListening && (
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <h3 className="text-lg font-semibold mb-2">Listening...</h3>
            <p className="text-gray-700">{transcript}</p>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-screen-lg mx-auto bg-white p-4 rounded shadow text-black"
      >
        <h1 className="text-2xl font-bold mb-4 text-black">
          Patient Registration &amp; Appointment Form
        </h1>

        {renderTabButtons()}

        {tabIndex === 0 && renderPatientDetailsTab()}
        {tabIndex === 1 && renderOtherDetailsTab()}
        {tabIndex === 2 && renderHistoryTab()}
        {tabIndex === 3 && renderAllergiesTab()}

        <div className="flex justify-end mt-4 gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded bg-gray-200 text-black"
          >
            Close
          </button>
          <button
            type="submit"
            className="px-4 py-2 border rounded bg-green-500 text-white"
          >
            {recordId ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistration;
