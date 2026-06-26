import type { OcrErrorCode } from "../services/ocr/types";

type OcrStringKey =
  | "screenTitle"
  | "idleHint"
  | "statusIdle"
  | "statusProcessing"
  | "statusResult"
  | "scanButton"
  | "galleryButton"
  | "scanAgain"
  | "useForStudy"
  | "resultTag"
  | "loadingTitle"
  | "loadingSubtitle"
  | "permissionTitle"
  | "permissionBody"
  | "permissionButton"
  | "tipGoodLight"
  | "tipHoldSteady";

const STRINGS: Record<"en" | "fil", Record<OcrStringKey, string>> = {
  en: {
    screenTitle: "Scan & Learn",
    idleHint: "Point at any text, problem, or worksheet",
    statusIdle: "Tap the button to scan, or pick from gallery",
    statusProcessing: "The AI is reading...",
    statusResult: "Text ready! Tap scan to try again",
    scanButton: "Scan",
    galleryButton: "Gallery",
    scanAgain: "Scan Again",
    useForStudy: "Use for Study",
    resultTag: "Text Detected",
    loadingTitle: "The AI is reading...",
    loadingSubtitle: "Hold on, we're finding the words",
    permissionTitle: "Camera Access Needed",
    permissionBody:
      "Kahayag needs your camera to scan textbook pages and worksheets.",
    permissionButton: "Allow Camera",
    tipGoodLight: "Tip: Use good lighting and hold the phone steady.",
    tipHoldSteady: "Try moving closer or adding more light.",
  },
  fil: {
    screenTitle: "Mag-scan at Matuto",
    idleHint: "Itutok sa anumang teksto, problem, o worksheet",
    statusIdle: "Pindutin ang button para mag-scan, o pumili mula sa gallery",
    statusProcessing: "Nagbabasa ang AI...",
    statusResult: "Handa na ang teksto! Mag-scan ulit kung gusto",
    scanButton: "Mag-scan",
    galleryButton: "Gallery",
    scanAgain: "Mag-scan Ulit",
    useForStudy: "Gamitin sa Pag-aaral",
    resultTag: "May Nakitang Teksto",
    loadingTitle: "Nagbabasa ang AI...",
    loadingSubtitle: "Sandali lang, hinahanap namin ang mga salita",
    permissionTitle: "Kailangan ng Camera",
    permissionBody:
      "Kailangan ng Kahayag ang camera mo para mag-scan ng textbook at worksheet.",
    permissionButton: "Payagan ang Camera",
    tipGoodLight: "Tip: Gumamit ng maliwanag na ilaw at hawakan nang steady ang phone.",
    tipHoldSteady: "Subukang lumapit o dagdagan ang ilaw.",
  },
};

const ERROR_MESSAGES: Record<
  "en" | "fil",
  Record<OcrErrorCode, string>
> = {
  en: {
    PERMISSION_DENIED: "Camera permission was denied. You can enable it in Settings.",
    CAPTURE_FAILED: "Could not take a photo. Please try again.",
    PREPROCESS_FAILED: "Could not prepare the image. Please try another photo.",
    RECOGNITION_FAILED: "Something went wrong while reading the text.",
    NO_TEXT_FOUND: "No text found. Try better lighting or move closer to the page.",
    GALLERY_CANCELLED: "Gallery selection was cancelled.",
  },
  fil: {
    PERMISSION_DENIED:
      "Hindi pinayagan ang camera. Pwede mong i-on sa Settings.",
    CAPTURE_FAILED: "Hindi makakuha ng litrato. Subukan ulit.",
    PREPROCESS_FAILED:
      "Hindi maayos ang litrato. Subukan ang ibang larawan.",
    RECOGNITION_FAILED: "May nangyaring mali habang binabasa ang teksto.",
    NO_TEXT_FOUND:
      "Walang nakitang teksto. Subukan ang mas maliwanag na ilaw o lumapit sa pahina.",
    GALLERY_CANCELLED: "Kinansela ang pagpili sa gallery.",
  },
};

export function getOcrStrings(language: string) {
  return language === "fil" ? STRINGS.fil : STRINGS.en;
}

export function getOcrErrorMessage(language: string, code: OcrErrorCode): string {
  const locale = language === "fil" ? "fil" : "en";
  return ERROR_MESSAGES[locale][code];
}
