import {
	Download,
	GripVertical,
	Loader2,
	Mic,
	Play,
	Plus,
	Square,
	Trash2,
	Upload,
	Volume2,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVibeVoice } from "@/hooks/useVibeVoice";

const API_BASE = "http://localhost:8880/api";

interface ConfigResponse {
	voices: string[];
	default_voice: string;
	sample_rate: number;
	model: string;
	device: string;
}

interface PodcastSegment {
	id: string;
	text: string;
	voice: string;
}

interface PodcastData {
	segments: PodcastSegment[];
	createdAt: string;
	version: string;
}

const languageNames: Record<string, string> = {
	en: "🇬🇧 English",
	de: "🇩🇪 German",
	fr: "🇫🇷 French",
	it: "🇮🇹 Italian",
	sp: "🇪🇸 Spanish",
	pt: "🇵🇹 Portuguese",
	nl: "🇳🇱 Dutch",
	pl: "🇵🇱 Polish",
	jp: "🇯🇵 Japanese",
	kr: "🇰🇷 Korean",
	in: "🇮🇳 Indian English",
};

// Delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Podcast Maker - Create multi-voice podcasts with TTS
 */
export function PodcastMaker() {
	const [segments, setSegments] = useState<PodcastSegment[]>([
		{
			id: crypto.randomUUID(),
			text: "Welcome to our podcast! Today we'll be discussing exciting topics.",
			voice: "en-Emma_woman",
		},
	]);

	const [voices, setVoices] = useState<string[]>([]);
	const [isLoadingVoices, setIsLoadingVoices] = useState(true);
	const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
	const [isPlayingAll, setIsPlayingAll] = useState(false);
	const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(-1);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const stopPlayAllRef = useRef(false);
	const segmentPlayFunctionsRef = useRef<Map<string, () => Promise<void>>>(
		new Map(),
	);

	// Fetch available voices on mount
	useEffect(() => {
		const fetchVoices = async () => {
			try {
				const response = await fetch(`${API_BASE}/config`);
				if (response.ok) {
					const config: ConfigResponse = await response.json();
					setVoices(config.voices);
				}
			} catch (err) {
				console.error("Failed to fetch voices:", err);
				// Default voices if API is unavailable
				setVoices([
					"en-Emma_woman",
					"en-Michael_man",
					"en-Sophie_woman",
					"en-James_man",
				]);
			} finally {
				setIsLoadingVoices(false);
			}
		};

		fetchVoices();
	}, []);

	// Group voices by language
	const groupedVoices = voices.reduce<Record<string, string[]>>(
		(acc, voice) => {
			const [lang] = voice.split("-");
			if (!acc[lang]) {
				acc[lang] = [];
			}
			acc[lang].push(voice);
			return acc;
		},
		{},
	);

	const addSegment = () => {
		const newSegment: PodcastSegment = {
			id: crypto.randomUUID(),
			text: "",
			voice: voices[0] || "en-Emma_woman",
		};
		setSegments([...segments, newSegment]);
	};

	const removeSegment = (id: string) => {
		if (segments.length > 1) {
			setSegments(segments.filter((s) => s.id !== id));
		}
	};

	const updateSegment = (
		id: string,
		field: keyof PodcastSegment,
		value: string,
	) => {
		setSegments(
			segments.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
		);
	};

	const exportPodcast = () => {
		const data: PodcastData = {
			segments,
			createdAt: new Date().toISOString(),
			version: "1.0.0",
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `podcast-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const importPodcast = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data: PodcastData = JSON.parse(e.target?.result as string);
				if (data.segments && Array.isArray(data.segments)) {
					setSegments(data.segments);
				}
			} catch (err) {
				console.error("Failed to parse podcast file:", err);
				alert("Invalid podcast file format");
			}
		};
		reader.readAsText(file);

		// Reset input
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Register segment play function
	const registerPlayFunction = useCallback(
		(id: string, playFn: () => Promise<void>) => {
			segmentPlayFunctionsRef.current.set(id, playFn);
		},
		[],
	);

	// Unregister segment play function
	const unregisterPlayFunction = useCallback((id: string) => {
		segmentPlayFunctionsRef.current.delete(id);
	}, []);

	// Play all segments sequentially
	const handlePlayAll = async () => {
		setIsPlayingAll(true);
		stopPlayAllRef.current = false;

		for (let i = 0; i < segments.length; i++) {
			if (stopPlayAllRef.current) {
				break;
			}

			const segment = segments[i];
			if (!segment.text.trim()) {
				continue; // Skip empty segments
			}

			setCurrentPlayingIndex(i);
			setPlayingSegmentId(segment.id);

			const playFn = segmentPlayFunctionsRef.current.get(segment.id);
			if (playFn) {
				try {
					await playFn();
				} catch (err) {
					console.error(`Failed to play segment ${i + 1}:`, err);
				}
			}

			// Wait a bit before starting next segment to ensure server is ready
			if (i < segments.length - 1 && !stopPlayAllRef.current) {
				await delay(500);
			}
		}

		setIsPlayingAll(false);
		setCurrentPlayingIndex(-1);
		setPlayingSegmentId(null);
	};

	const handleStopAll = () => {
		stopPlayAllRef.current = true;
		setIsPlayingAll(false);
		setCurrentPlayingIndex(-1);
		setPlayingSegmentId(null);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
			{/* Animated background orbs */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
				<div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
				<div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500" />
			</div>

			<div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
				{/* Header */}
				<header className="text-center mb-10">
					<div className="inline-flex items-center gap-3 mb-4">
						<div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/25">
							<Mic className="w-8 h-8 text-white" />
						</div>
						<h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
							Podcast Maker
						</h1>
					</div>
					<p className="text-slate-400 text-lg">
						Create multi-voice podcasts with AI text-to-speech
					</p>
				</header>

				{/* Action Bar */}
				<div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={addSegment}
							disabled={isPlayingAll}
							className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 text-white disabled:text-slate-400 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed"
						>
							<Plus className="w-5 h-5" />
							Add Segment
						</button>

						<span className="text-slate-500 text-sm">
							{segments.length} segment{segments.length !== 1 ? "s" : ""}
						</span>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={exportPodcast}
							disabled={isPlayingAll}
							className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 text-slate-300 hover:text-white disabled:text-slate-600 rounded-xl font-medium transition-all duration-300 border border-slate-700 hover:border-slate-600 disabled:border-slate-800 disabled:cursor-not-allowed"
						>
							<Download className="w-4 h-4" />
							Export
						</button>

						<label
							className={`flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-medium transition-all duration-300 cursor-pointer border border-slate-700 hover:border-slate-600 ${isPlayingAll ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
						>
							<Upload className="w-4 h-4" />
							Import
							<input
								ref={fileInputRef}
								type="file"
								accept=".json"
								onChange={importPodcast}
								disabled={isPlayingAll}
								className="hidden"
							/>
						</label>
					</div>
				</div>

				{/* Segments */}
				<div className="space-y-4 mb-8">
					{segments.map((segment, index) => (
						<SegmentCard
							key={segment.id}
							segment={segment}
							index={index}
							voices={voices}
							groupedVoices={groupedVoices}
							isLoadingVoices={isLoadingVoices}
							isPlaying={playingSegmentId === segment.id}
							isPlayingAll={isPlayingAll}
							canDelete={segments.length > 1}
							onUpdate={updateSegment}
							onRemove={removeSegment}
							onPlayingChange={(playing) =>
								setPlayingSegmentId(playing ? segment.id : null)
							}
							registerPlayFunction={registerPlayFunction}
							unregisterPlayFunction={unregisterPlayFunction}
						/>
					))}
				</div>

				{/* Play All Footer */}
				<div className="sticky bottom-4 p-4 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-2xl shadow-black/50">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<Volume2 className="w-5 h-5 text-purple-400" />
							<div>
								<p className="text-white font-medium">Full Podcast</p>
								<p className="text-slate-400 text-sm">
									{isPlayingAll
										? `Playing segment ${currentPlayingIndex + 1} of ${segments.length}`
										: `${segments.length} segments ready`}
								</p>
							</div>
						</div>

						{isPlayingAll ? (
							<button
								type="button"
								onClick={handleStopAll}
								className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-red-500/25"
							>
								<Square className="w-5 h-5" />
								Stop Podcast
							</button>
						) : (
							<button
								type="button"
								onClick={handlePlayAll}
								disabled={segments.every((s) => !s.text.trim())}
								className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-700 text-white disabled:text-slate-500 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-green-500/25 disabled:shadow-none disabled:cursor-not-allowed"
							>
								<Play className="w-5 h-5" />
								Play Podcast
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Individual segment card component
 */
function SegmentCard({
	segment,
	index,
	voices,
	groupedVoices,
	isLoadingVoices,
	isPlaying,
	isPlayingAll,
	canDelete,
	onUpdate,
	onRemove,
	onPlayingChange,
	registerPlayFunction,
	unregisterPlayFunction,
}: {
	segment: PodcastSegment;
	index: number;
	voices: string[];
	groupedVoices: Record<string, string[]>;
	isLoadingVoices: boolean;
	isPlaying: boolean;
	isPlayingAll: boolean;
	canDelete: boolean;
	onUpdate: (id: string, field: keyof PodcastSegment, value: string) => void;
	onRemove: (id: string) => void;
	onPlayingChange: (playing: boolean) => void;
	registerPlayFunction: (id: string, playFn: () => Promise<void>) => void;
	unregisterPlayFunction: (id: string) => void;
}) {
	const { read, stop, isReading, isConnecting, error } = useVibeVoice(
		{ api: API_BASE },
		{ model: "microsoft/VibeVoice-Realtime-0.5B" },
		{ speaker_name: segment.voice },
		{ device: "cuda" },
	);

	// Create a play function that returns a promise
	const playSegment = useCallback(async () => {
		if (!segment.text.trim()) return;

		try {
			await read(segment.text, {
				cfg_scale: 1.5,
				inference_steps: 5,
			});
		} catch (err) {
			console.error("Failed to read:", err);
			throw err;
		}
	}, [segment.text, read]);

	// Register this segment's play function with the parent
	useEffect(() => {
		registerPlayFunction(segment.id, playSegment);
		return () => {
			unregisterPlayFunction(segment.id);
		};
	}, [segment.id, playSegment, registerPlayFunction, unregisterPlayFunction]);

	const handlePlay = async () => {
		if (!segment.text.trim()) return;
		onPlayingChange(true);
		try {
			await playSegment();
		} catch (err) {
			console.error("Failed to read:", err);
		}
		onPlayingChange(false);
	};

	const handleStop = () => {
		stop();
		onPlayingChange(false);
	};

	const isActive = isReading || isConnecting;

	return (
		<div
			className={`group relative p-5 bg-slate-900/50 backdrop-blur-xl rounded-2xl border transition-all duration-500 ${
				isActive
					? "border-purple-500/50 shadow-lg shadow-purple-500/10"
					: "border-slate-800/50 hover:border-slate-700/50"
			}`}
		>
			{/* Segment number indicator */}
			<div className="absolute -left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
				<GripVertical className="w-4 h-4 text-slate-600" />
			</div>

			<div
				className={`absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-12 rounded-full transition-colors ${
					isActive
						? "bg-gradient-to-b from-purple-500 to-pink-500"
						: "bg-slate-700 group-hover:bg-slate-600"
				}`}
			/>

			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					<span className="flex items-center justify-center w-8 h-8 bg-slate-800 rounded-lg text-slate-400 text-sm font-medium">
						{index + 1}
					</span>
					<h3 className="text-white font-medium">Segment {index + 1}</h3>
					{isActive && (
						<span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 rounded-full">
							{isConnecting ? (
								<Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
							) : (
								<span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
							)}
							<span className="text-purple-300 text-xs font-medium">
								{isConnecting ? "Connecting..." : "Playing..."}
							</span>
						</span>
					)}
				</div>

				{canDelete && (
					<button
						type="button"
						onClick={() => onRemove(segment.id)}
						disabled={isActive || isPlayingAll}
						className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				)}
			</div>

			{/* Voice selector and play button */}
			<div className="flex items-center gap-3 mb-4">
				<div className="flex-1">
					<label className="block text-slate-400 text-xs font-medium mb-1.5">
						Voice
					</label>
					<select
						value={segment.voice}
						onChange={(e) => onUpdate(segment.id, "voice", e.target.value)}
						disabled={isActive || isLoadingVoices || isPlayingAll}
						className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
						style={{
							backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239ca3af' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
							backgroundRepeat: "no-repeat",
							backgroundPosition: "right 0.75rem center",
						}}
					>
						{isLoadingVoices ? (
							<option>Loading voices...</option>
						) : (
							Object.entries(groupedVoices).map(([lang, langVoices]) => (
								<optgroup
									key={lang}
									label={languageNames[lang] || lang.toUpperCase()}
								>
									{langVoices.map((voice) => (
										<option key={voice} value={voice}>
											{voice.replace(/_/g, " ").replace(/-/g, " - ")}
										</option>
									))}
								</optgroup>
							))
						)}
					</select>
				</div>

				{isActive ? (
					<button
						type="button"
						onClick={handleStop}
						className="mt-5 flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-all duration-300"
					>
						<Square className="w-4 h-4" />
						Stop
					</button>
				) : (
					<button
						type="button"
						onClick={handlePlay}
						disabled={!segment.text.trim() || isPlayingAll}
						className="mt-5 flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 text-white disabled:text-slate-600 rounded-xl font-medium transition-all duration-300 border border-slate-700 disabled:border-slate-800 disabled:cursor-not-allowed"
					>
						<Play className="w-4 h-4" />
						Play
					</button>
				)}
			</div>

			{/* Text input */}
			<div>
				<label className="block text-slate-400 text-xs font-medium mb-1.5">
					Text Content
				</label>
				<textarea
					value={segment.text}
					onChange={(e) => onUpdate(segment.id, "text", e.target.value)}
					placeholder="Enter text for this segment..."
					disabled={isActive || isPlayingAll}
					rows={3}
					className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				/>
			</div>

			{/* Error display */}
			{error && !isPlayingAll && (
				<div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
					<p className="text-red-300 text-sm">⚠️ {error}</p>
				</div>
			)}
		</div>
	);
}

export default PodcastMaker;
