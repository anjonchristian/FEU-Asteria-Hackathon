import { Ionicons } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CameraView } from "expo-camera";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams } from "expo-router"; // ADD THIS
import CropView from "../components/CropView";
import { OcrCaptureView } from "../components/ocr/OcrCaptureView";
import { Colors, FontSize, Radius, Spacing } from "../constants/theme";
import { useOcrWorkflow } from "../hooks/useOcrWorkflow";
import { generateQuizFromText } from "../services/sml/quizGenerator";
import { useProfile } from "../store/profile";
import { useVaultStore } from "../store/vault";

type Source = "paste" | "pdf" | "camera" | null;
type Difficulty = "Easy" | "Medium" | "Hard";

const QUESTION_COUNTS = [5, 10, 15, 20];
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

export default function CreateDeckScreen() {
  const { subjects, language, name, grade } = useProfile();
  const { addDeck } = useVaultStore();
  const cameraRef = useRef<CameraView | null>(null);

  const [source, setSource] = useState<Source>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OCR workflow — used only for the scan path inside this screen
  const ocr = useOcrWorkflow();

  const activeText = source === "paste" ? pastedText : extractedText;
  const canGenerate = activeText.trim().length > 50 && !isGenerating;

  const { subjectId } = useLocalSearchParams<{ subjectId?: string }>();

  // ── PDF path ────────────────────────────────────────────────────────────────
  const handlePickPdf = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      setIsExtracting(true);
      setSource("pdf");
      setExtractedText("");

      const fileUri = result.assets[0].uri;
      const f = new File(fileUri);
      const base64 = await f.text();

      const genAI = new GoogleGenerativeAI(
        process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "",
      );
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent([
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64,
          },
        },
        "Extract all the text content from this document. Return only the plain text, no formatting.",
      ]);

      setExtractedText(response.response.text());
    } catch (e) {
      setError("Could not read the PDF. Try pasting the text instead.");
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Scan path — opens full OCR scanner modal ────────────────────────────────
  const handleOpenScanner = () => {
    ocr.reset();
    setSource("camera");
    setShowScanner(true);
  };

  // Called when OCR produces a result — user taps "Use this text"
  const handleUseScannedText = () => {
    if (!ocr.pipelineResult) return;
    setExtractedText(ocr.pipelineResult.result.cleanedText);
    setShowScanner(false);
    ocr.reset();
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
    ocr.reset();
    if (extractedText.length === 0) setSource(null);
  };

  // ── Generate ─────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setError(null);

    try {
      const difficultyInstruction =
        difficulty === "Easy"
          ? "Keep questions simple and straightforward for beginners."
          : difficulty === "Hard"
            ? "Make questions challenging, requiring deep understanding."
            : "Make questions moderately challenging.";

      const deck = await generateQuizFromText(
        null,
        `${difficultyInstruction}\n\n${activeText}`,
        subjectId || (subjects.length > 0 ? subjects[0] : "general"), // UPDATE THIS LINE
        questionCount,
      );

      addDeck(deck);
      router.back();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Generation failed. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backText}>Vault</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create Deck</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1 — source */}
        <Text style={styles.sectionLabel}>1. Add your material</Text>
        <View style={styles.sourceRow}>
          <SourceCard
            icon="create-outline"
            label="Paste Text"
            active={source === "paste"}
            onPress={() => {
              setSource("paste");
              setExtractedText("");
            }}
          />
          <SourceCard
            icon="document-outline"
            label="Upload PDF"
            active={source === "pdf"}
            onPress={handlePickPdf}
          />
          <SourceCard
            icon="camera-outline"
            label="Scan Page"
            active={source === "camera"}
            onPress={handleOpenScanner}
          />
        </View>

        {/* Paste input */}
        {source === "paste" && (
          <TextInput
            style={styles.textInput}
            value={pastedText}
            onChangeText={setPastedText}
            placeholder="Paste or type your class material here..."
            placeholderTextColor={Colors.mutedText}
            multiline
            textAlignVertical="top"
          />
        )}

        {/* Extracting spinner */}
        {isExtracting && (
          <View style={styles.extractingCard}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.extractingText}>Reading content...</Text>
          </View>
        )}

        {/* Extracted text preview */}
        {!isExtracting && extractedText.length > 0 && (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewLabel}>Extracted text</Text>
              <Pressable onPress={handleOpenScanner}>
                <Text style={styles.rescanText}>Re-scan</Text>
              </Pressable>
            </View>
            <Text style={styles.previewText} numberOfLines={6}>
              {extractedText}
            </Text>
            <Text style={styles.previewMeta}>
              {extractedText.length} characters
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color="#C94343" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Step 2 — config */}
        <Text style={styles.sectionLabel}>2. Configure your quiz</Text>

        <Text style={styles.configLabel}>Number of questions</Text>
        <View style={styles.chipRow}>
          {QUESTION_COUNTS.map((n) => (
            <Pressable
              key={n}
              onPress={() => setQuestionCount(n)}
              style={[styles.chip, questionCount === n && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  questionCount === n && styles.chipTextActive,
                ]}
              >
                {n}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.configLabel}>Difficulty</Text>
        <View style={styles.chipRow}>
          {DIFFICULTIES.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              style={[styles.chip, difficulty === d && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  difficulty === d && styles.chipTextActive,
                ]}
              >
                {d}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Generate */}
        <Pressable
          onPress={handleGenerate}
          disabled={!canGenerate}
          style={({ pressed }) => [
            styles.generateBtn,
            !canGenerate && styles.generateBtnDisabled,
            pressed && styles.pressed,
          ]}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.generateBtnText}>Generating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.generateBtnText}>
                Generate {questionCount} Questions
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {/* ── Full-screen OCR scanner modal ───────────────────────────────────── */}
      <Modal
        visible={showScanner}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseScanner}
      >
        <View style={styles.modalFill}>
          {/* If no pending crop photo, show the main OCR viewfinder */}
          {!ocr.pendingPhoto && (
            <OcrCaptureView
              cameraRef={cameraRef}
              scanState={ocr.scanState}
              pipelineResult={ocr.pipelineResult}
              errorMessage={ocr.errorMessage}
              savedForStudy={false}
              isGeneratingQuiz={false}
              onCapture={() => ocr.captureFromCamera(cameraRef)}
              onPickGallery={ocr.pickFromGallery}
              onSaveForStudy={() => {}}
              onGenerateQuiz={() => {}}
              onReset={ocr.reset}
              onClose={handleCloseScanner}
              onTextCaptured={(text) => {
                setExtractedText(text);
                setShowScanner(false);
                ocr.reset();
              }}
            />
          )}

          {/* Crop view shown after camera capture */}
          {ocr.pendingPhoto && (
            <CropView
              imageUri={ocr.pendingPhoto.uri}
              imageWidth={ocr.pendingPhoto.width}
              imageHeight={ocr.pendingPhoto.height}
              onCropComplete={ocr.onCropComplete}
              onCancel={ocr.cancelCrop}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SourceCard({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.sourceCard,
        active && styles.sourceCardActive,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={icon as any}
        size={26}
        color={active ? Colors.primary : Colors.mutedText}
      />
      <Text style={[styles.sourceLabel, active && styles.sourceLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { flexDirection: "row", alignItems: "center", width: 60 },
  backText: { color: Colors.primary, fontWeight: "700", fontSize: FontSize.sm },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
    marginTop: Spacing.sm,
  },
  sourceRow: { flexDirection: "row", gap: Spacing.sm },
  sourceCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: "#fff",
  },
  sourceCardActive: {
    borderColor: Colors.primary,
    backgroundColor: "#E5F5EE",
  },
  sourceLabel: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    color: Colors.mutedText,
    textAlign: "center",
  },
  sourceLabelActive: { color: Colors.primary },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    minHeight: 160,
    fontSize: FontSize.sm,
    color: Colors.forest,
    fontWeight: "600",
  },
  extractingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  extractingText: {
    color: Colors.mutedText,
    fontWeight: "700",
    fontSize: FontSize.sm,
  },
  previewCard: {
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewLabel: {
    fontSize: FontSize.xs,
    fontWeight: "900",
    color: Colors.primary,
  },
  rescanText: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    color: Colors.teal,
  },
  previewText: {
    fontSize: FontSize.sm,
    color: Colors.forest,
    lineHeight: 20,
    fontWeight: "500",
  },
  previewMeta: {
    fontSize: FontSize.xs,
    color: Colors.mutedText,
    fontWeight: "700",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#FEE2E2",
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  errorText: {
    flex: 1,
    color: "#C94343",
    fontWeight: "700",
    fontSize: FontSize.sm,
  },
  configLabel: {
    fontSize: FontSize.sm,
    fontWeight: "800",
    color: Colors.mutedText,
  },
  chipRow: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: "#fff",
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: "#E5F5EE" },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: "800",
    color: Colors.mutedText,
  },
  chipTextActive: { color: Colors.primary },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  generateBtnDisabled: { opacity: 0.4, elevation: 0 },
  generateBtnText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  modalFill: { flex: 1, backgroundColor: "#000" },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
});
