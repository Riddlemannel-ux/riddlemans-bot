const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const PREFIX = "!"

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth")

  const sock = makeWASocket({
    auth: state,
    browser: ["riddleman's-bot", "Chrome", "1.0"]
  })

  // Save session
  sock.ev.on("creds.update", saveCreds)

  // Connection updates
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      console.log("❌ Connection closed. Reconnecting:", shouldReconnect)

      if (shouldReconnect) {
        startBot()
      }
    } else if (connection === "open") {
      console.log("✅ riddleman's-bot connected to WhatsApp!")
    }
  })

  // 🔑 Pairing Code
  if (!sock.authState.creds.registered) {
    const phoneNumber = "2347035378872" // 👈 PUT YOUR NUMBER HERE

    setTimeout(async () => {
      const code = await sock.requestPairingCode(phoneNumber)
      console.log("🔑 Your Pairing Code:", code)
    }, 3000)
  }

  // 📩 Messages
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0]
    if (!msg.message) return

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text

    if (!text) return

    if (text.startsWith(PREFIX + "ping")) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🏓 Pong! riddleman's-bot is alive!"
      })
    }
  })
}

startBot()
