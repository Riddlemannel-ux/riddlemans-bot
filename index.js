const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys")

const P = "!"

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth")

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Atlas Bot", "Chrome", "1.0.0"]
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode

            const shouldReconnect =
                statusCode !== DisconnectReason.loggedOut

            console.log("❌ Connection closed. Reconnecting...")

            if (shouldReconnect) {
                startBot()
            }
        }

        if (connection === "open") {
            console.log("✅ Bot is online!")
        }
    })

    sock.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0]
            if (!msg.message || msg.key.fromMe) return

            const body =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                ""

            const from = msg.key.remoteJid

            if (!body.startsWith(P)) return

            const command = body.slice(1).trim().split(" ")[0].toLowerCase()

            if (command === "hi") {
                await sock.sendMessage(from, { text: "👋 Hello! Bot is working." })
            }

            else if (command === "menu") {
                await sock.sendMessage(from, {
                    text:
`🤖 *BOT MENU*
⚡ !hi
📜 !menu
🔥 !ping`
                })
            }

            else if (command === "ping") {
                await sock.sendMessage(from, { text: "🏓 Pong!" })
            }

            else {
                await sock.sendMessage(from, { text: "❌ Unknown command. Try !menu" })
            }

        } catch (err) {
            console.log("Message error:", err)
        }
    })
}

startBot()