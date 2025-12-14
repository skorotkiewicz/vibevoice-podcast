# 🎙️ Podcast Maker

Create multi-voice podcasts with AI text-to-speech. Add segments, assign different voices to each, preview in real-time, and export as audio.

## Features

- **Multi-segment editing** — Add unlimited text segments
- **Per-segment voices** — Assign different voices to each segment
- **Real-time preview** — Play individual segments or the entire podcast
- **Audio export** — Download your podcast as a single WAV file
- **Project management** — Export/Import podcasts as JSON

---

## Prerequisites

### 1. Clone VibeVoice

```bash
git clone https://github.com/microsoft/VibeVoice
cd VibeVoice
```

### 2. Start the API Server

Copy the server script to your VibeVoice directory:

```bash
cp example/server.py /path/to/VibeVoice/demo/server.py
```

Run the server:

```bash
cd /path/to/VibeVoice
python demo/server.py --model microsoft/VibeVoice-Realtime-0.5B --device cuda --port 8880
```

The server will start at `http://localhost:8880`.

---

## Running the Frontend

```bash
# Install dependencies
bun install   # or npm install

# Start development server
bun dev       # or npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Usage

### Creating a Podcast

1. **Add segments** — Click "Add Segment" to create new text entries
2. **Write content** — Enter text for each segment
3. **Select voices** — Choose a voice from the dropdown for each segment
4. **Preview** — Click "Play" on individual segments or "Play Podcast" for all

### Exporting

- **JSON** — Save your project with "Export JSON" to continue editing later
- **Audio** — Click "Download Audio" to generate a WAV file of the complete podcast

### Importing

Click "Import" and select a previously saved JSON file to restore your project.

---

## Example Podcasts

Check the `example/` folder for sample podcast JSON files you can import.

---

## Configuration

The frontend connects to the API at `http://localhost:8880/api`. To change this, edit the `API_BASE` constant in `src/App.tsx`.

---

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + VibeVoice TTS
- **Audio**: WebSocket streaming with real-time PCM playback

---

## License

MIT
