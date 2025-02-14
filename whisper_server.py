from flask import Flask, request, jsonify
import os
import subprocess

app = Flask(__name__)

WHISPER_MODEL = "/Users/fabio/Sistemas/whisper/whisper.cpp/models/small.bin"

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    audio_file = request.files["file"]
    audio_path = "temp_audio.ogg"
    audio_file.save(audio_path)

    wav_path = "temp_audio.wav"
    os.system(f"ffmpeg -i {audio_path} -ac 1 -ar 16000 -sample_fmt s16 {wav_path}")

    output_file = "temp_audio.wav.txt"

    command = f"whisper-cli -m {WHISPER_MODEL} -f {wav_path} --output-txt > {output_file} --no-gpu"
    subprocess.run(command, shell=True)

    if os.path.exists(output_file):
        with open(output_file, "r", encoding="utf-8") as f:
            transcription = f.read().replace("\x00", "").strip()
        os.remove(output_file)
    else:
        transcription = "Erro na transcrição"

    os.remove(audio_path)
    os.remove(wav_path)

    return jsonify({"text": transcription})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)
