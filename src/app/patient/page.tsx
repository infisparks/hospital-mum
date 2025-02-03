"use client";

import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { db } from "./../../../firebaseconfig";
import { ref, push, set, get, child } from "firebase/database";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

// -----------------------------------------------------------------------------
// 1. Ophthalmic & Systemic Data Structures for the "History" tab
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// 2. Allergies Data Structures
// -----------------------------------------------------------------------------

// For an individual drug/contact/food item
type AllergyItem = {
  name: string;
  duration: string;
  durationUnit: string;
  comments: string;
};

// Drug categories, each with its own possible sub‐items
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

// Contact allergies
const CONTACT_ALLERGIES_LIST = [
  "Alcohol",
  "Latex",
  "Betadine",
  "Adhesive Tape",
  "Tegaderm",
  "Transpore",
];

// Food allergies
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

// -----------------------------------------------------------------------------
// 3. Main Form Data Structures
// -----------------------------------------------------------------------------

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

  // Ophthalmic & Systemic Histories
  ophthalmicHistory: OphthalmicItem[];
  systemicHistory: SystemicItem[];
  medicalHistory: string;
  familyHistory: string;
  pediatricNutritionalStatus: string;
  pediatricComments: string;
  immunizationAssessment: string;

  // Allergies
  // --- For Drug Allergies, we store an object of sub‐category => selected items
  drugAllergies: {
    [category: string]: AllergyItem[];
  };
  drugAllergiesComment: string;

  // --- Contact allergies: a single array of chosen items
  contactAllergies: AllergyItem[];
  contactAllergiesComment: string;

  // --- Food allergies: a single array of chosen items
  foodAllergies: AllergyItem[];
  foodAllergiesComment: string;

  // --- any other special field you want
  otherAllergy: string;
};

// Default Values
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

// -----------------------------------------------------------------------------
// 4. The main component
// -----------------------------------------------------------------------------

const Home: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, handleSubmit, reset, watch, setValue } =
    useForm<FormData>({ defaultValues });

  // ---------------------------------------------------------------------------
  // Define your clinic ID – you can replace this with a dynamic value later.
  // ---------------------------------------------------------------------------
  const clinicId = "clinic1";

  // Keep track of the active big tab
  const [tabIndex, setTabIndex] = useState(0);

  // If editing an existing record, store recordId
  const [recordId, setRecordId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) setRecordId(id);
  }, [searchParams]);

  // ---------------------------------------------------------------------------
  // 4A. Fetch if editing (using the clinic-based path)
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // 4B. On form submit (using the clinic-based path)
  // ---------------------------------------------------------------------------
  const onSubmit = async (formValues: FormData) => {
    try {
      if (recordId) {
        await set(
          ref(db, `clinic/${clinicId}/patientdetail/${recordId}`),
          formValues
        );
        alert("Updated existing patient: " + recordId);
      } else {
        const newRef = push(
          ref(db, `clinic/${clinicId}/patientdetail`)
        );
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

  // ---------------------------------------------------------------------------
  // 4C. Photo upload
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // 4D. Voice commands
  // ---------------------------------------------------------------------------
  const voiceCommands = [
    {
      command: "first name *",
      callback: (name: string) => {
        setValue("firstName", name.trim(), { shouldValidate: true });
        toast.info("First Name set to: " + name);
      },
    },
    {
      command: "last name *",
      callback: (name: string) => {
        setValue("lastName", name.trim(), { shouldValidate: true });
        toast.info("Last Name set to: " + name);
      },
    },
    {
      command: "mobile number *",
      callback: (number: string) => {
        const sanitized = number.replace(/\D/g, "");
        setValue("mobileNumber", sanitized, { shouldValidate: true });
        toast.info("Mobile Number set to: " + sanitized);
      },
    },
    {
      command: "email *",
      callback: (email: string) => {
        setValue("email", email.trim(), { shouldValidate: true });
        toast.info("Email set to: " + email);
      },
    },
    {
      command: "whatsapp number *",
      callback: (num: string) => {
        const sanitized = num.replace(/\D/g, "");
        setValue("whatsappNumber", sanitized, { shouldValidate: true });
        toast.info("WhatsApp Number set to: " + sanitized);
      },
    },
    {
      command: "dob *",
      callback: (dob: string) => {
        setValue("dob", dob.trim(), { shouldValidate: true });
        toast.info("DOB set to: " + dob);
      },
    },
    {
      command: "appointment date *",
      callback: (date: string) => {
        setValue("appointmentDate", date.trim(), { shouldValidate: true });
        toast.info("Appointment Date set to: " + date);
      },
    },
    {
      command: "appointment time *",
      callback: (time: string) => {
        setValue("appointmentTime", time.trim(), { shouldValidate: true });
        toast.info("Appointment Time set to: " + time);
      },
    },
    {
      command: "show patient details",
      callback: () => {
        setTabIndex(0);
        toast.info("Switched to Patient Details tab.");
      },
    },
    {
      command: "show other details",
      callback: () => {
        setTabIndex(1);
        toast.info("Switched to Other Details tab.");
      },
    },
    {
      command: "show history",
      callback: () => {
        setTabIndex(2);
        toast.info("Switched to History tab.");
      },
    },
    {
      command: "show allergies",
      callback: () => {
        setTabIndex(3);
        toast.info("Switched to Allergies tab.");
      },
    },
    {
      command: "submit",
      callback: () => {
        handleSubmit(onSubmit)();
      },
    },
  ];

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

  // ---------------------------------------------------------------------------
  // 4E. Tabs
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // 5. Render: Patient Details tab
  // ---------------------------------------------------------------------------
  const renderPatientDetailsTab = () => (
    <div className="flex flex-col md:flex-row gap-4 text-black">
      {/* Left side (Patient Info) */}
      <div className="flex-1 p-4 bg-white shadow rounded space-y-4">
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

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-black">Mobile Number*</label>
            <input
              {...register("mobileNumber", { required: true })}
              className="border rounded p-1 w-full text-black"
            />
          </div>
          <div>
            <label className="text-black">Secondary Number</label>
            <input
              {...register("secondaryNumber")}
              className="border rounded p-1 w-full text-black"
            />
          </div>
        </div>

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

      {/* Right side (Appointment) */}
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

  // ---------------------------------------------------------------------------
  // 6. Render: Other Details tab
  // ---------------------------------------------------------------------------
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
            <label className="font-semibold text-black">Emergency Contact</label>
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

  // ---------------------------------------------------------------------------
  // 7. Render: History tab (Ophthalmic + Systemic + Pediatric)
  // ---------------------------------------------------------------------------
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

    // Update an ophthalmic field
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

    // Copy right -> left
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

    // Update a systemic field
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
                            updateOphField(
                              item.name,
                              "rightDuration",
                              e.target.value
                            )
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
                            updateOphField(
                              item.name,
                              "leftDuration",
                              e.target.value
                            )
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

  // ---------------------------------------------------------------------------
  // 8. Render: Allergies tab (Drug, Contact, Food)
  // ---------------------------------------------------------------------------

  // Track which drug category is active (e.g. "Antimicrobial Agents")
  const [activeDrugCategory, setActiveDrugCategory] = useState<string>(
    DRUG_CATEGORIES[0].category
  );

  // Helper to toggle a drug item within a specific category
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
      setValue(
        `drugAllergies.${category}`,
        [...categoryList, newItem],
        { shouldDirty: true }
      );
    }
  };

  // Update a field in a selected drug item
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

  // Contact Allergies
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

  // Food Allergies
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

          {/* Subcategory tabs: Antimicrobial, Antifungal, etc. */}
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

          {/* Show the pills for the currently active category */}
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

          {/* Table of selected items in this category */}
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
                            updateContactField(
                              item.name,
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
                            updateContactField(
                              item.name,
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

  // ---------------------------------------------------------------------------
  // 9. Render Page
  // ---------------------------------------------------------------------------
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

export default Home;
