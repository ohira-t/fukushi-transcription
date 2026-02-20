"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  FileAudio,
  Sparkles,
  CheckCircle2,
  User,
  Calendar,
  FileText,
  Loader2,
  X,
  Play,
  Pause,
  Mic,
  MicOff,
  Clock,
  ChevronRight,
  FolderOpen,
  Eye,
  Printer,
  Download,
  Square,
  ClipboardCopy,
  Building2,
} from "lucide-react";

interface DiaryRecord {
  id: string;
  userName: string;
  recordDate: string;
  morning: string;
  afternoon: string;
  other: string;
  notes: string;
  createdAt: string;
}

const mockAIResult = {
  userName: "山田 太郎",
  recordDate: "2026-02-20",
  morning:
    "・データ入力作業に従事。集中力を維持し、ミスなく業務を遂行できた\n・他の利用者と協力して作業を進め、コミュニケーションも良好",
  afternoon:
    "・午後は軽作業（封入・シール貼り）に取り組んだ\n・面談を実施。最近の体調や生活リズムについて確認\n・本人より「朝の起床が安定してきた」との報告あり",
  other:
    "・昼休憩は食堂で他利用者と談笑。食欲良好\n・午後に軽い疲労感の訴えあったが、休憩後に回復",
  notes:
    "・生活リズムの安定が見られ、就労意欲も向上傾向\n・次回モニタリング時に就労移行の可能性についてアセスメント予定\n・通院状況の確認を継続すること",
};

const demoRecords: DiaryRecord[] = [
  {
    id: "1",
    userName: "佐藤 一郎",
    recordDate: "2026-02-19",
    morning:
      "・PC入力作業に取り組む。タイピング速度が向上しており、目標の80%を達成\n・作業手順書を確認しながら正確に作業を進めた",
    afternoon:
      "・清掃作業に従事。丁寧に取り組み、チェックリストを活用できた\n・個別面談を実施。就労に対する前向きな発言が増えている",
    other: "・昼食は完食。体調は安定している\n・帰宅時の表情が明るかった",
    notes:
      "・就労移行支援への移行について、本人と段階的に話し合いを進める\n・主治医への報告書を次回通院時に持参予定",
    createdAt: "2026-02-19T16:30:00",
  },
  {
    id: "2",
    userName: "鈴木 美智子",
    recordDate: "2026-02-18",
    morning:
      "・軽作業（検品）を実施。集中力にばらつきがあり、途中で休憩を挟んだ\n・スタッフの声かけにより作業再開できた",
    afternoon:
      "・グループワークに参加。他利用者との関わりは良好\n・面談にて服薬状況を確認。飲み忘れが週1回程度ある",
    other:
      "・昼食時、やや食欲低下の訴えあり\n・午後は体調を見ながら無理のないペースで作業",
    notes:
      "・服薬管理の支援強化が必要。お薬カレンダーの導入を検討\n・次回通院時に主治医へ食欲低下について相談するよう助言",
    createdAt: "2026-02-18T17:00:00",
  },
  {
    id: "3",
    userName: "田中 健太",
    recordDate: "2026-02-17",
    morning:
      "・遅刻（10分）があったが、到着後はすぐに作業に取り組めた\n・ピッキング作業を担当。正確性は高いが作業速度にやや課題",
    afternoon:
      "・引き続きピッキング作業。午前より作業ペースが改善\n・振り返りの時間に自分の課題を的確に言語化できた",
    other:
      "・遅刻の理由は寝坊とのこと。生活リズムの乱れが散見される\n・水分補給の声かけに素直に応じた",
    notes:
      "・生活リズムの改善が最優先課題。起床時間の記録を本人と約束\n・遅刻が続く場合は通所日数の見直しも検討\n・次回ケース会議で共有予定",
    createdAt: "2026-02-17T15:45:00",
  },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [records, setRecords] = useState<DiaryRecord[]>(demoRecords);
  const [selectedRecord, setSelectedRecord] = useState<DiaryRecord | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioInputMode, setAudioInputMode] = useState<"upload" | "record">(
    "record"
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [formData, setFormData] = useState({
    userName: "",
    recordDate: "",
    morning: "",
    afternoon: "",
    other: "",
    notes: "",
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAnalysisComplete(false);
      setIsConfirmed(false);
      setFormData({
        userName: "",
        recordDate: "",
        morning: "",
        afternoon: "",
        other: "",
        notes: "",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("audio/")) {
      setFile(droppedFile);
      setAnalysisComplete(false);
      setIsConfirmed(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const ext = recorder.mimeType.includes("mp4") ? "m4a" : "webm";
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType,
        });
        const recordedFile = new File(
          [blob],
          `録音_${new Date().toLocaleString("ja-JP").replace(/[/:]/g, "-")}.${ext}`,
          { type: recorder.mimeType }
        );
        setFile(recordedFile);
        setAnalysisComplete(false);
        setIsConfirmed(false);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(
        () => setRecordingTime((prev) => prev + 1),
        1000
      );
    } catch {
      alert(
        "マイクへのアクセスが許可されていません。\nブラウザの設定からマイクの使用を許可してください。"
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnalyze = () => {
    if (!file) return;
    setIsAnalyzing(true);
    setIsConfirmed(false);

    setTimeout(() => {
      setFormData(mockAIResult);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 3000);
  };

  const handleConfirm = () => {
    const newRecord: DiaryRecord = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    };
    setRecords([newRecord, ...records]);
    setIsConfirmed(true);
  };

  const handleReset = () => {
    setFile(null);
    setAnalysisComplete(false);
    setIsConfirmed(false);
    setRecordingTime(0);
    setFormData({
      userName: "",
      recordDate: "",
      morning: "",
      afternoon: "",
      other: "",
      notes: "",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const buildOutputText = (data: typeof formData) => {
    return `【午前】\n${data.morning}\n\n【午後】\n${data.afternoon}\n\n【その他】\n${data.other}\n\n【特記事項】\n${data.notes}`;
  };

  const handleCopyOutput = () => {
    const text = buildOutputText(formData);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f4] via-[#e8f5f0] to-[#dbeee5]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#d1e7dd] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2d8a6f] to-[#0d9488] rounded-xl flex items-center justify-center shadow-lg shadow-[#2d8a6f]/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[#1a3a2f]">
                  福祉事業文字起こしシステム
                </h1>
                <p className="text-xs sm:text-sm text-[#6b8a7f]">
                  音声からAIが業務日誌テキストを自動作成
                </p>
              </div>
            </div>

            <div className="flex bg-[#e8f5f0] rounded-xl p-1">
              <button
                onClick={() => setActiveTab("create")}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "create"
                    ? "bg-white text-[#2d8a6f] shadow-sm"
                    : "text-[#6b8a7f] hover:text-[#2d8a6f]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  <span className="hidden sm:inline">新規作成</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "history"
                    ? "bg-white text-[#2d8a6f] shadow-sm"
                    : "text-[#6b8a7f] hover:text-[#2d8a6f]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">記録履歴</span>
                  <span className="bg-[#2d8a6f] text-white text-xs px-2 py-0.5 rounded-full">
                    {records.length}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "history" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Record List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-lg shadow-[#2d8a6f]/5 border border-[#d1e7dd]">
                <h2 className="text-lg font-semibold text-[#1a3a2f] mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#2d8a6f]" />
                  最近の記録
                </h2>
                <div className="space-y-2">
                  {records.map((record) => (
                    <button
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedRecord?.id === record.id
                          ? "border-[#2d8a6f] bg-[#e8f5f0]"
                          : "border-[#d1e7dd] hover:border-[#2d8a6f]/50 hover:bg-[#f0f9f4]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#2d8a6f] to-[#0d9488] rounded-full flex items-center justify-center text-white font-medium">
                            {record.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-[#1a3a2f]">
                              {record.userName}
                            </p>
                            <p className="text-sm text-[#6b8a7f]">
                              {formatDate(record.recordDate)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-5 h-5 transition-colors ${
                            selectedRecord?.id === record.id
                              ? "text-[#2d8a6f]"
                              : "text-[#d1e7dd]"
                          }`}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Record Detail */}
            <div className="lg:col-span-2">
              {selectedRecord ? (
                <div className="bg-white rounded-2xl shadow-lg shadow-[#2d8a6f]/5 border border-[#d1e7dd] overflow-hidden">
                  <div className="bg-gradient-to-r from-[#2d8a6f] to-[#0d9488] px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                          {selectedRecord.userName.charAt(0)}
                        </div>
                        <div className="text-white">
                          <h3 className="text-xl font-bold">
                            {selectedRecord.userName}
                          </h3>
                          <p className="text-white/80 text-sm">
                            記録日: {formatDate(selectedRecord.recordDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                          <Printer className="w-5 h-5 text-white" />
                        </button>
                        <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                          <Download className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="bg-[#f0f9f4] rounded-xl p-4">
                      <div className="flex items-center gap-2 text-[#6b8a7f] text-sm mb-1">
                        <Clock className="w-4 h-4" />
                        作成日時
                      </div>
                      <p className="font-medium text-[#1a3a2f]">
                        {formatDateTime(selectedRecord.createdAt)}
                      </p>
                    </div>

                    {[
                      {
                        label: "午前",
                        value: selectedRecord.morning,
                        icon: "🌅",
                      },
                      {
                        label: "午後",
                        value: selectedRecord.afternoon,
                        icon: "🌇",
                      },
                      {
                        label: "その他",
                        value: selectedRecord.other,
                        icon: "📋",
                      },
                      {
                        label: "特記事項",
                        value: selectedRecord.notes,
                        icon: "⚠️",
                      },
                    ].map((section) => (
                      <div key={section.label}>
                        <h4 className="flex items-center gap-2 text-sm font-medium text-[#6b8a7f] mb-2">
                          <span>{section.icon}</span>
                          {section.label}
                        </h4>
                        <div className="bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl p-4">
                          <p className="text-[#1a3a2f] whitespace-pre-line leading-relaxed">
                            {section.value}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-3 pt-4 border-t border-[#d1e7dd]">
                      <button
                        onClick={() => {
                          const text = buildOutputText(selectedRecord);
                          navigator.clipboard.writeText(text);
                        }}
                        className="flex-1 py-3 border border-[#2d8a6f] text-[#2d8a6f] rounded-xl font-medium hover:bg-[#e8f5f0] transition-colors flex items-center justify-center gap-2"
                      >
                        <ClipboardCopy className="w-4 h-4" />
                        コピー
                      </button>
                      <button className="flex-1 py-3 bg-gradient-to-r from-[#2d8a6f] to-[#0d9488] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#2d8a6f]/30 transition-all flex items-center justify-center gap-2">
                        <Printer className="w-4 h-4" />
                        印刷する
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 shadow-lg shadow-[#2d8a6f]/5 border border-[#d1e7dd] flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-20 h-20 bg-[#e8f5f0] rounded-2xl flex items-center justify-center mb-4">
                    <Eye className="w-10 h-10 text-[#2d8a6f]/40" />
                  </div>
                  <p className="text-[#6b8a7f] text-center">
                    左のリストから記録を選択すると
                    <br />
                    詳細が表示されます
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : isConfirmed ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-float">
            <div className="bg-white rounded-3xl p-12 shadow-xl shadow-[#2d8a6f]/10 text-center max-w-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-[#4ade9f] to-[#2d8a6f] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#2d8a6f]/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#1a3a2f] mb-3">
                業務日誌テキストの作成が完了しました
              </h2>
              <p className="text-[#6b8a7f] mb-8">
                「記録履歴」タブで確認・コピーできます。
                <br />
                はぐパスの業務日誌に貼り付けてご利用ください。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 border border-[#2d8a6f] text-[#2d8a6f] rounded-xl font-medium hover:bg-[#e8f5f0] transition-colors"
                >
                  新しい記録を作成
                </button>
                <button
                  onClick={() => {
                    setActiveTab("history");
                    setSelectedRecord(records[0]);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#2d8a6f] to-[#0d9488] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#2d8a6f]/30 transition-all"
                >
                  記録を確認する
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Pane - Audio Input */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-[#2d8a6f]/5 border border-[#d1e7dd]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-[#e8f5f0] rounded-lg flex items-center justify-center">
                    <Mic className="w-4 h-4 text-[#2d8a6f]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#1a3a2f]">
                    音声入力
                  </h2>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-[#f0f9f4] rounded-xl p-1 mb-6">
                  <button
                    onClick={() => setAudioInputMode("record")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      audioInputMode === "record"
                        ? "bg-white text-[#2d8a6f] shadow-sm"
                        : "text-[#6b8a7f] hover:text-[#2d8a6f]"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    録音する
                  </button>
                  <button
                    onClick={() => setAudioInputMode("upload")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      audioInputMode === "upload"
                        ? "bg-white text-[#2d8a6f] shadow-sm"
                        : "text-[#6b8a7f] hover:text-[#2d8a6f]"
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    ファイル選択
                  </button>
                </div>

                {audioInputMode === "record" ? (
                  /* Recording UI */
                  <div className="text-center">
                    {!file ? (
                      <div className="py-8">
                        {isRecording ? (
                          <div className="space-y-6">
                            <div className="relative inline-block">
                              <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/30 animate-pulse-gentle">
                                <Mic className="w-12 h-12 text-white" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full animate-pulse" />
                            </div>
                            <div>
                              <p className="text-2xl font-mono font-bold text-[#1a3a2f]">
                                {formatRecordingTime(recordingTime)}
                              </p>
                              <p className="text-sm text-red-500 font-medium mt-1">
                                録音中...
                              </p>
                            </div>
                            <div className="flex items-center justify-center gap-1 h-8">
                              {[...Array(20)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1 bg-red-400 rounded-full animate-wave"
                                  style={{
                                    height: `${Math.random() * 24 + 8}px`,
                                    animationDelay: `${i * 0.05}s`,
                                  }}
                                />
                              ))}
                            </div>
                            <button
                              onClick={stopRecording}
                              className="inline-flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                              <Square className="w-5 h-5" />
                              録音を停止
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <button
                              onClick={startRecording}
                              className="w-24 h-24 bg-gradient-to-br from-[#2d8a6f] to-[#0d9488] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#2d8a6f]/30 hover:shadow-xl hover:shadow-[#2d8a6f]/40 transition-all hover:scale-105 active:scale-95"
                            >
                              <Mic className="w-12 h-12 text-white" />
                            </button>
                            <div>
                              <p className="font-medium text-[#1a3a2f]">
                                タップして録音開始
                              </p>
                              <p className="text-sm text-[#6b8a7f] mt-1">
                                面談内容や業務報告を録音してください
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-6 space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#2d8a6f] to-[#0d9488] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#2d8a6f]/20">
                          <FileAudio className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1a3a2f]">
                            {file.name}
                          </p>
                          <p className="text-sm text-[#6b8a7f]">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                            {recordingTime > 0 &&
                              ` / ${formatRecordingTime(recordingTime)}`}
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-10 h-10 bg-[#2d8a6f] rounded-full flex items-center justify-center text-white hover:bg-[#0d9488] transition-colors"
                          >
                            {isPlaying ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5 ml-0.5" />
                            )}
                          </button>
                          <button
                            onClick={handleReset}
                            className="text-sm text-[#6b8a7f] hover:text-red-500 transition-colors flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            削除して録り直す
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Upload UI */
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                      file
                        ? "border-[#2d8a6f] bg-[#e8f5f0]"
                        : "border-[#d1e7dd] hover:border-[#2d8a6f] hover:bg-[#f0f9f4]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {file ? (
                      <div className="space-y-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#2d8a6f] to-[#0d9488] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#2d8a6f]/20">
                          <FileAudio className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1a3a2f]">
                            {file.name}
                          </p>
                          <p className="text-sm text-[#6b8a7f]">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReset();
                          }}
                          className="text-sm text-[#6b8a7f] hover:text-red-500 transition-colors flex items-center gap-1 mx-auto"
                        >
                          <X className="w-4 h-4" />
                          ファイルを削除
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 bg-[#e8f5f0] rounded-2xl flex items-center justify-center mx-auto">
                          <Upload className="w-8 h-8 text-[#2d8a6f]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1a3a2f]">
                            音声ファイルをドラッグ＆ドロップ
                          </p>
                          <p className="text-sm text-[#6b8a7f]">
                            またはクリックしてファイルを選択
                          </p>
                        </div>
                        <p className="text-xs text-[#6b8a7f]">
                          対応形式: MP3, WAV, M4A, AAC, WebM
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Analyze Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                  className={`w-full mt-6 py-4 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all duration-300 ${
                    file && !isAnalyzing
                      ? "bg-gradient-to-r from-[#2d8a6f] to-[#0d9488] hover:shadow-lg hover:shadow-[#2d8a6f]/30 hover:-translate-y-0.5"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      文字起こし中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      AIで業務日誌テキストを作成
                    </>
                  )}
                </button>
              </div>

              {/* System Prompt Info */}
              <div className="bg-gradient-to-br from-[#e8f5f0] to-[#dbeee5] rounded-2xl p-6 border border-[#d1e7dd]">
                <h3 className="font-semibold text-[#1a3a2f] mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2d8a6f]" />
                  はぐパス業務日誌 出力形式
                </h3>
                <div className="text-sm text-[#6b8a7f] space-y-1.5 font-mono bg-white/60 rounded-lg p-4">
                  <p className="font-bold text-[#2d8a6f]">【午前】</p>
                  <p className="pl-2">作業内容や本人の様子</p>
                  <p className="font-bold text-[#2d8a6f]">【午後】</p>
                  <p className="pl-2">作業内容、面談での気づき</p>
                  <p className="font-bold text-[#2d8a6f]">【その他】</p>
                  <p className="pl-2">休憩・体調・生活面</p>
                  <p className="font-bold text-[#2d8a6f]">【特記事項】</p>
                  <p className="pl-2">課題、指導方針、約束事</p>
                </div>
              </div>
            </div>

            {/* Right Pane - AI Generated Draft */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-[#2d8a6f]/5 border border-[#d1e7dd]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-[#e8f5f0] rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#2d8a6f]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#1a3a2f]">
                    AI生成 業務日誌テキスト
                  </h2>
                </div>

                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#2d8a6f] to-[#0d9488] rounded-2xl flex items-center justify-center animate-pulse-gentle shadow-lg shadow-[#2d8a6f]/30">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#4ade9f] rounded-full flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    </div>
                    <p className="mt-6 text-lg font-medium text-[#1a3a2f]">
                      AIが業務日誌テキストを作成中...
                    </p>
                    <p className="text-sm text-[#6b8a7f] mt-2">
                      音声を解析して情報を抽出しています
                    </p>
                    <div className="flex items-center gap-1 mt-6">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 bg-[#2d8a6f] rounded-full animate-wave wave-${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : analysisComplete ? (
                  <div className="space-y-5">
                    {/* User Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-[#1a3a2f] mb-2">
                        <User className="w-4 h-4 text-[#2d8a6f]" />
                        利用者名
                      </label>
                      <input
                        type="text"
                        value={formData.userName}
                        onChange={(e) =>
                          setFormData({ ...formData, userName: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-[#d1e7dd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8a6f]/30 focus:border-[#2d8a6f] transition-all bg-[#f9fdfb]"
                        placeholder="利用者名を入力"
                      />
                    </div>

                    {/* Record Date */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-[#1a3a2f] mb-2">
                        <Calendar className="w-4 h-4 text-[#2d8a6f]" />
                        記録日
                      </label>
                      <input
                        type="date"
                        value={formData.recordDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recordDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-[#d1e7dd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8a6f]/30 focus:border-[#2d8a6f] transition-all bg-[#f9fdfb]"
                      />
                    </div>

                    {/* Morning */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-[#1a3a2f] mb-2">
                        <span>🌅</span>
                        午前
                      </label>
                      <textarea
                        value={formData.morning}
                        onChange={(e) =>
                          setFormData({ ...formData, morning: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-[#d1e7dd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8a6f]/30 focus:border-[#2d8a6f] transition-all bg-[#f9fdfb] resize-none"
                        placeholder="午前の作業内容や本人の様子"
                      />
                    </div>

                    {/* Afternoon */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-[#1a3a2f] mb-2">
                        <span>🌇</span>
                        午後
                      </label>
                      <textarea
                        value={formData.afternoon}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            afternoon: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-[#d1e7dd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8a6f]/30 focus:border-[#2d8a6f] transition-all bg-[#f9fdfb] resize-none"
                        placeholder="午後の作業内容、面談での気づき"
                      />
                    </div>

                    {/* Other */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-[#1a3a2f] mb-2">
                        <span>📋</span>
                        その他
                      </label>
                      <textarea
                        value={formData.other}
                        onChange={(e) =>
                          setFormData({ ...formData, other: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-[#d1e7dd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8a6f]/30 focus:border-[#2d8a6f] transition-all bg-[#f9fdfb] resize-none"
                        placeholder="休憩や体調、生活面について"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-[#1a3a2f] mb-2">
                        <span>⚠️</span>
                        特記事項
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-[#d1e7dd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8a6f]/30 focus:border-[#2d8a6f] transition-all bg-[#f9fdfb] resize-none"
                        placeholder="今後の課題、指導方針、本人との約束事"
                      />
                    </div>

                    {/* Copy Output Button */}
                    <button
                      onClick={handleCopyOutput}
                      className="w-full py-3 border border-[#2d8a6f] text-[#2d8a6f] rounded-xl font-medium hover:bg-[#e8f5f0] transition-colors flex items-center justify-center gap-2"
                    >
                      <ClipboardCopy className="w-4 h-4" />
                      {copied
                        ? "コピーしました！"
                        : "はぐパス用テキストをコピー"}
                    </button>

                    {/* Confirm Button */}
                    <button
                      onClick={handleConfirm}
                      className="w-full py-4 bg-gradient-to-r from-[#2d8a6f] to-[#0d9488] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#2d8a6f]/30 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      これで確定
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-[#e8f5f0] rounded-2xl flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 text-[#2d8a6f]/40" />
                    </div>
                    <p className="text-[#6b8a7f]">
                      音声を録音またはアップロードして
                      <br />
                      「AIで業務日誌テキストを作成」をクリック
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#d1e7dd] bg-white/50 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-center text-sm text-[#6b8a7f]">
            福祉事業文字起こしシステム - 就労継続支援A型 業務日誌作成支援
          </p>
        </div>
      </footer>
    </div>
  );
}
