(function () {
  class WalmartChatClient {
    constructor(socketUrl, htmlContent) {
      this.socketUrl = socketUrl;
      this.htmlContent = htmlContent;
      this.websocket = null;
      this.session = {};
    }

    connect(onMessage, onError) {
      this.websocket = new WebSocket(this.socketUrl);

      this.websocket.onopen = () => {
        this.websocket.send(JSON.stringify({ type: "initialize", source: "walmart" }));
      };

      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "initialized":
            this.session = data;
            this.websocket.send(JSON.stringify({ type: "html_data", html_content: this.htmlContent }));
            break;
          case "html_ack":
            console.log("HTML acknowledged, ready for queries");
            break;
          case "query_response":
            onMessage?.(data.response);
            break;
          default:
            if (data.error) onError?.(data.error);
        }
      };

      this.websocket.onerror = (e) => onError?.("WebSocket error", e);
      this.websocket.onclose = () => console.log("WebSocket closed");
    }

    sendMessage(message) {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: "query", question: message }));
      } else {
        console.error("WebSocket is not open");
      }
    }

    disconnect() {
      this.websocket?.close();
    }
  }

  if (document.getElementById("walmart-chat-icon")) return;

  const style = document.createElement("style");
  style.textContent = `
    .typing-dots span {
      display: inline-block;
      animation: blink 1.4s infinite both;
      font-weight: bold;
      font-size: 18px;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink {
      0%, 80%, 100% { opacity: 0; }
      40% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  const chatIcon = document.createElement("div");
  chatIcon.id = "walmart-chat-icon";
  Object.assign(chatIcon.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "50px",
    height: "50px",
    background: "linear-gradient(135deg, #1c1c1c, #333)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    zIndex: "10000",
    transition: "transform 0.2s ease-in-out"
  });

  const chatIconImg = document.createElement("img");
  chatIconImg.src = "data:image/svg+xml;utf8,<svg width='24px' height='24px' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><defs><linearGradient id='chatGradient' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23FFA500'/><stop offset='100%' stop-color='%23FFFF00'/></linearGradient><filter id='fancyShadow' x='-50%' y='-50%' width='200%' height='200%'><feDropShadow dx='0' dy='2' stdDeviation='2' flood-color='%23000000' flood-opacity='0.3'/></filter></defs><g filter='url(%23fancyShadow)'><path fill='url(%23chatGradient)' d='M21 10.975V8a2 2 0 0 0-2-2h-6V4.688c.305-.274.5-.668.5-1.11a1.5 1.5 0 0 0-3 0c0 .442.195.836.5 1.11V6H5a2 2 0 0 0-2 2v2.998l-.072.005A.999.999 0 0 0 2 12v2a1 1 0 0 0 1 1v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a1 1 0 0 0 1-1v-1.938a1.004 1.004 0 0 0-.072-.455c-.202-.488-.635-.605-.928-.632zM7 12c0-1.104.672-2 1.5-2s1.5.896 1.5 2-.672 2-1.5 2S7 13.104 7 12zm8.998 6c-1.001-.003-7.997 0-7.998 0v-2s7.001-.002 8.002 0l-.004 2zm-.498-4c-.828 0-1.5-.896-1.5-2s.672-2 1.5-2 1.5.896 1.5 2-.672 2-1.5 2z'/></g></svg>";
  Object.assign(chatIconImg.style, {
    width: "70%",
    height: "70%"
  });
  chatIcon.appendChild(chatIconImg);

  chatIcon.addEventListener("mouseenter", () => chatIcon.style.transform = "scale(1.05)");
  chatIcon.addEventListener("mouseleave", () => chatIcon.style.transform = "scale(1)");
  chatIcon.addEventListener("click", () => {
    if (!chatWindow) {
      if (!window.location.href.includes("/ip/")) {
        alert("Know Your Product is only available on product pages.");
      } else {
        createChatWindow();
      }
    }
  });

  document.body.appendChild(chatIcon);

  let chatWindow = null;
  let chatClient = null;
  let botMessageEl = null;
  let isMaximized = false;

  function createChatWindow() {
    if (chatWindow) return;

    chatWindow = document.createElement("div");
    Object.assign(chatWindow.style, {
      position: "fixed",
      bottom: "80px",
      right: "20px",
      width: "320px",
      height: "450px",
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
      zIndex: "10000",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Arial, sans-serif",
      transition: "all 0.3s ease"
    });

    const header = document.createElement("div");
    header.style.cssText = "background:#0071dc;color:#fff;padding:12px;display:flex;justify-content:space-between;align-items:center;font-weight:bold;";
    header.innerHTML = `<span>Know Your Product</span>`;

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";

    const createHeaderButton = (label, onClick, html) => {
      const btn = document.createElement("span");
      btn.innerHTML = html;
      Object.assign(btn.style, { fontSize: "18px", margin: "8px", cursor: "pointer" });
      btn.addEventListener("click", onClick);
      buttonContainer.appendChild(btn);
    };

    createHeaderButton("maximize", toggleChatSize, "&#x26F6;");
    createHeaderButton("refresh", refreshChat, "&#8635;");
    createHeaderButton("close", removeChatWindow, "&times;");

    header.appendChild(buttonContainer);
    chatWindow.appendChild(header);

    const messages = document.createElement("div");
    messages.id = "chat-messages";
    Object.assign(messages.style, {
      flex: "1",
      padding: "10px",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    });
    chatWindow.appendChild(messages);

    const inputWrap = document.createElement("div");
    inputWrap.style.cssText = "display:flex;align-items:center;padding:10px;border-top:1px solid #ddd;background:#f9f9f9;";
    const input = document.createElement("input");
    Object.assign(input.style, {
      flex: "1",
      padding: "8px",
      borderRadius: "6px",
      border: "1px solid #ccc",
      fontSize: "14px"
    });
    input.placeholder = "Type your message...";
    const sendBtn = document.createElement("button");
    sendBtn.textContent = "Send";
    Object.assign(sendBtn.style, {
      marginLeft: "8px",
      padding: "8px 12px",
      backgroundColor: "#0071dc",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontWeight: "bold",
      cursor: "pointer"
    });

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", (e) => e.key === "Enter" && sendMessage());

    inputWrap.appendChild(input);
    inputWrap.appendChild(sendBtn);
    chatWindow.appendChild(inputWrap);
    document.body.appendChild(chatWindow);

    function sendMessage() {
      const message = input.value.trim();
      if (!message) return;

      appendMessage("You", message);
      input.value = "";

      if (!chatClient) {
        chatClient = new WalmartChatClient("ws://localhost:8080/chat", document.documentElement.outerHTML);
        chatClient.connect(handleResponse, (err) => appendMessage("WalmartBot", `Error: ${err}`));
        setTimeout(() => chatClient.sendMessage(message), 1000);
      } else {
        chatClient.sendMessage(message);
      }
    }

    function handleResponse(response) {
      if (response === "==EOF==") {
        botMessageEl?.querySelector(".typing-dots")?.remove();
        botMessageEl = null;
        return;
      }

      if (!botMessageEl) {
        botMessageEl = document.createElement("div");
        botMessageEl.textContent = response;
        Object.assign(botMessageEl.style, {
          padding: "8px",
          borderRadius: "8px",
          backgroundColor: "#f1f1f1",
          color: "black",
          maxWidth: "75%",
          wordWrap: "break-word",
          alignSelf: "flex-start",
          position: "relative"
        });

        const dots = document.createElement("span");
        dots.className = "typing-dots";
        dots.innerHTML = "<span>.</span><span>.</span><span>.</span>";
        Object.assign(dots.style, {
          marginLeft: "5px"
        });

        botMessageEl.appendChild(dots);
        messages.appendChild(botMessageEl);
        messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
      } else {
        botMessageEl.firstChild.textContent += response;
      }
    }

    function appendMessage(sender, text) {
      const msg = document.createElement("div");
      msg.textContent = text;
      Object.assign(msg.style, {
        padding: "8px",
        borderRadius: "8px",
        maxWidth: "75%",
        wordWrap: "break-word",
        alignSelf: sender === "You" ? "flex-end" : "flex-start",
        backgroundColor: sender === "You" ? "#0071dc" : "#f1f1f1",
        color: sender === "You" ? "white" : "black"
      });
      messages.appendChild(msg);
      messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
    }
  }

  function toggleChatSize() {
    if (!chatWindow) return;
    const styles = isMaximized
      ? { width: "320px", height: "450px", right: "20px", bottom: "80px", borderRadius: "12px" }
      : { width: "100vw", height: "100vh", right: "0", bottom: "0", borderRadius: "0" };
    Object.assign(chatWindow.style, styles);
    isMaximized = !isMaximized;
  }

  function refreshChat() {
    if (chatClient) {
      chatClient.disconnect();
      chatClient = null;
    }
    chatWindow?.remove();
    chatWindow = null;
    createChatWindow();
  }

  function removeChatWindow() {
    chatWindow?.remove();
    chatWindow = null;
    chatClient?.disconnect();
    chatClient = null;
  }
})();
