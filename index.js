const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const audioDir = path.join(__dirname, "audios");
if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => qrcode.generate(qr, { small: true }));
client.on("ready", () => console.log("Pronto"));

const WHISPER_URL = "http://127.0.0.1:9000/transcribe";

client.on("message", async (msg) => {
    if (msg.from.endsWith("@g.us")) {
        return;
    }

    if (msg.hasMedia && msg.type === "ptt") {
        const media = await msg.downloadMedia();
        const filePath = path.join(audioDir, `${msg.id.id}.ogg`);
        fs.writeFileSync(filePath, media.data, "base64");

        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath));

        try {
            const response = await axios.post(WHISPER_URL, formData, {
                headers: formData.getHeaders(),
            });

            if (response.data?.text && response.data.text.trim() !== "") {
                msg.reply("*Transcrição do áudio:*\n\n" + response.data.text);
            }
        } catch (error) {
            console.error("Erro na transcrição:", error);
        }

        fs.unlinkSync(filePath);
    }
});

client.initialize();
