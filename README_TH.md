# 🦞 ClawWizard (ภาษาไทย)

**ClawWizard** คือเครื่องมือติดตั้งแบบโต้ตอบ (Interactive Setup Wizard) ระดับพรีเมียมสำหรับ [OpenClaw](https://github.com/openclaw/openclaw) ผู้ช่วย AI ส่วนตัวของคุณ โดยตัวเครื่องมือนี้มาพร้อมกับหน้าจอ GUI ที่สวยงามและใช้งานง่าย เพื่อช่วยในการตั้งค่า OpenClaw Gateway ตั้งแต่การเลือกผู้ให้บริการโมเดล, ช่องทางการสื่อสาร, พื้นที่ทำงานเอเจนต์ (Workspace), เทมเพลตบุคลิก และการกดติดตั้ง (Deploy) เพียงครั้งเดียว

<p align="center">
  <img src="/public/banner.png" alt="ClawWizard Banner" width="700">
</p>

## ✨ คุณสมบัติเด่น

- **🎯 ระบบติดตั้งแบบโต้ตอบ**: ให้คำแนะนำแบบเป็นขั้นตอน เหมาะสำหรับทั้งมือใหม่และมือโปร
- **🤖 ระบบเลือกผู้ให้บริการและโมเดล**: รองรับผู้ให้บริการ LLM กว่า 20+ ราย เช่น Anthropic, OpenAI, Kilocode, Ollama, OpenRouter, Groq, Gemini, DeepSeek, Mistral และอื่น ๆ
- **💬 การจัดการช่องทางสื่อสาร**: ตั้งค่าได้ง่ายกว่า **20+ แพลตฟอร์ม** — WhatsApp, Telegram, Discord, Slack, Signal, iMessage, BlueBubbles, LINE, Matrix, Nextcloud Talk, Microsoft Teams, Feishu, Mattermost, Google Chat, Tlon, Nostr, IRC, Twitch, Zalo, Synology Chat
- **👥 รองรับแชทกลุ่ม**: ควบคุมการเข้าถึงรายกลุ่มด้วย `groupPolicy` (allowlist/blocklist/public) และตั้งค่า `requireMention` รายกลุ่มได้
- **🔐 ระบบ Pairing**: ขั้นตอนการจับคู่สำหรับแชทส่วนตัวที่ปลอดภัย (ผ่านคำสั่ง `openclaw pairing approve`)
- **🎭 เทมเพลตเอเจนต์ (Workspace Templates)**: มีเทมเพลตสำเร็จรูปกว่า 15+ แบบสำหรับทุกไฟล์ของ OpenClaw (`AGENTS.md`, `SOUL.md`, `IDENTITY` ฯลฯ) ครอบคลุมทั้งแนว AI-agent สายเทพ, บอทปั่นๆ ตลกๆ และแบบมืออาชีพ
- **🛠️ เครื่องมือและทักษะ**: เลือกและตั้งค่ากลุ่มเครื่องมือ (Tool Groups) สำหรับเอเจนต์ AI ของคุณ
- **🚀 การติดตั้งจริง (One-click Deploy)**: ติดตั้งได้ทั้งในเครื่อง (Local) หรือ **VPS ผ่าน SSH** ระบบจะเขียนไฟล์, รัน Gateway และเปิดหน้า Dashboard ให้คุณทันที
- **☁️ รองรับ Cloud/Remote**: มีระบบจัดการ SSH ในตัว ช่วยให้คุณติดตั้ง OpenClaw บน Linux Server ได้โดยตรงจากหน้า Wizard
- **🖥️ แอปเดสก์ท็อป (Native App)**: รันเป็นโปรแกรมขนาดเล็กบน Windows และ macOS ได้โดยไม่ต้องใช้เบราว์เซอร์ (ผ่าน **Tauri**)
- **🛰️ การแสดง Log แบบ Real-time**: รับชมการทำงานของเอเจนต์ AI ผ่านหน้าจอ Terminal บนเว็บแบบสด ๆ
- **💎 ดีไซน์ระดับพรีเมียม**: อินเตอร์เฟซสไตล์ Glassmorphism โหมดมืด พร้อมแอนิเมชันที่ไหลลื่น

---

## 🗺️ ขั้นตอนการทำงาน (Wizard Flow)

```mermaid
flowchart TD
    A([🦞 เริ่ม ClawWizard]) --> B

    subgraph STEP1["ขั้นตอนที่ 1 · ยินดีต้อนรับ"]
        B[เลือกรูปแบบการใช้งาน\nส่วนตัว / เขียนโค้ด / วิจัย\nอัตโนมัติ / เทรดดิ้ง / กำหนดเอง]
        B --> B2[เลือกเทมเพลตสำเร็จรูป\nหรือเริ่มจากหน้าว่าง]
    end

    B2 --> C

    subgraph STEP2["ขั้นตอนที่ 2 · โมเดลและสิทธิ์"]
        C[เลือกค่าย AI (Provider)\nมีให้เลือกกว่า 20 ค่าย]
        C --> C2{ใช้ API Key ไหม?}
        C2 -- ใช่ --> C3[กรอก API Key\nหรือข้ามไปก่อน]
        C2 -- ไม่ใช่ --> C4[เชื่อมต่อผ่าน OAuth / รันในเครื่อง\nเช่น Ollama, Qwen]
    end

    C3 & C4 --> D

    subgraph STEP3["ขั้นตอนที่ 3 · พื้นที่ทำงานและบุคลิก"]
        D[แก้ไขไฟล์ระบบ OpenClaw]
        D --> D1[SOUL.md · บุคลิกและการตอบโต]
        D --> D2[AGENTS.md · กฎการทำงาน]
        D --> D3[IDENTITY · ชื่อและอิโมจิ]
        D --> D4[ไฟล์อื่นๆ · BOOT / HEARTBEAT / TOOLS / USER]
        D1 & D2 & D3 & D4 --> D5[🎭 ผสมผสานเทมเพลต\nเลือกแทรกเนื้อหาหรือทับใหม่รายไฟล์]
    end

    D5 --> E

    subgraph STEP4["ขั้นตอนที่ 4 · Gateway"]
        E[ตั้งค่าระเบียง (Gateway)\nPort / Bind / Tailscale / ระบบยืนยันตัวตน]
    end

    E --> F

    subgraph STEP5["ขั้นตอนที่ 5 · ช่องทางสื่อสาร"]
        F[เปิดใช้งานโซเชียลต่างๆ\nWhatsApp · Telegram · Discord · Slack\nSignal · Matrix · LINE · Zalo · ...]
        F --> F2{ใช้ในกลุ่มไหม?}
        F2 -- ใช่ --> F3[เลือกกลุ่มเป้าหมาย (allowlist)\nบังคับแท็กบอท / หา ID กลุ่มผ่าน CLI]
        F2 -- ไม่ใช่ --> F4[ตั้งค่าแชทส่วนตัว\nเน้นการจับคู่ (Pairing) หรือสาธารณะ]
    end

    F3 & F4 --> G

    subgraph STEP6["ขั้นตอนที่ 6 · เครื่องมือ"]
        G[เลือกกลุ่มเครื่องมือ (Tool Groups)\nจัดการไฟล์ · เบราว์เซอร์ · รันโค้ด\nเมมโมรี่ · งานตั้งเวลา (Cron)]
    end

    G --> H

    subgraph STEP7["ขั้นตอนที่ 7 · สรุปและรัน"]
        H[ตรวจสอบไฟล์ openclaw.json]
        H --> I{เลือกวิธีรัน?}
        I -- รันในเครื่อง (Local) --> J[🚀 เขียนไฟล์ลงเครื่อง\nสั่งเริ่ม Gateway]
        I -- รันบนรีโมท (Remote) --> JR[☁️ เชื่อมต่อ SSH\nติดตั้งและรันบน VPS]
        I -- ใส่โค้ดเอง (Manual) --> K[📋 ก๊อปปี้คำสั่ง CLI]
    end

    J & JR --> L[✅ บอทออนไลน์แล้ว!\nเปิดหน้า Dashboard 🌐\nเปิดหน้าจอควบคุม 💻]
    K --> M[⚙️ พิมพ์: openclaw onboard\nตามด้วย: openclaw pairing approve]

    style A fill:#ff6b35,color:#fff,stroke:none
    style L fill:#22c55e,color:#fff,stroke:none
    style STEP1 fill:#1a1a2e,stroke:#ff6b35,color:#fff
    style STEP2 fill:#1a1a2e,stroke:#ff6b35,color:#fff
    style STEP3 fill:#1a1a2e,stroke:#ff6b35,color:#fff
    style STEP4 fill:#1a1a2e,stroke:#ff6b35,color:#fff
    style STEP5 fill:#1a1a2e,stroke:#ff6b35,color:#fff
    style STEP6 fill:#1a1a2e,stroke:#ff6b35,color:#fff
    style STEP7 fill:#1a1a2e,stroke:#ff6b35,color:#fff
```

---

## 💡 คู่มือสำหรับมือใหม่ (ฉบับไม่เก่งคอมก็ทำได้!)

หากคุณไม่เคยใช้โปรแกรมเขียนโค้ด หรือไม่รู้จักว่า "Terminal" คืออะไร ไม่ต้องตกใจครับ! ทำตามขั้นตอนนี้ทีละสั้นๆ คุณจะสามารถเปิดใช้งาน ClawWizard ได้แน่นอน

### 1. เตรียมเครื่องมือให้พร้อม (ทางลัดแบบง่ายสุดๆ 🚀)

คุณต้องมี "เครื่องยนต์" สำหรับรันโปรแกรมนี้ก่อนครับ เลือกทำอย่างใดอย่างหนึ่ง:

- **วิธีที่ 1 (อัตโนมัติ)**: หาไฟล์ที่ชื่อ `install_nodejs.ps1` ในโฟลเดอร์นี้ **คลิกขวาที่ไฟล์** แล้วเลือก **"Run with PowerShell"** ระบบจะโหลดและติดตั้งให้คุณเองโดยอัตโนมัติ!
- **วิธีที่ 2 (ทำเอง)**: ไปที่เว็บไซต์ [nodejs.org](https://nodejs.org/) แล้วกดปุ่มที่เขียนว่า **"LTS"** เพื่อดาวน์โหลดและติดตั้งเหมือนโปรแกรมทั่วไป

### 2. วิธีการเปิดโปรแกรม (สำหรับมือใหม่สุดๆ)

**สำหรับ Windows:**

1. ไปที่โฟลเดอร์ `ClawWizard` ที่คุณดาวน์โหลดมา (หรือที่เก็บโปรเจกต์นี้)
2. คลิกที่แถบที่อยู่ด้านบนของหน้าต่างโฟลเดอร์ (ที่มันเขียนว่า `D:\Projects\...`)
3. พิมพ์คำว่า `cmd` แล้วกด **Enter**
   - *หน้าต่างสีดำๆ จะโผล่ขึ้นมา นั่นแหละครับคือสิ่งที่เรียกว่า Terminal หรือ Command Prompt*
4. พิมพ์คำสั่งนี้ลงไปแล้วกด Enter:

   ```bash
   npm install
   ```

   *(รอจนมันวิ่งเสร็จ ห้ามปิดหน้าต่างนี้นะครับ)*
5. เมื่อเสร็จแล้ว พิมพ์คำสั่งสุดท้ายเพื่อเริ่มโปรแกรม:

   ```bash
   npm run dev
   ```

### 3. เริ่มใช้งานจริง

- หลังจากพิมพ์คำสั่งสุดท้าย เบราว์เซอร์ของคุณจะเปิดขึ้นมาที่หน้าจอสวยๆ (ถ้าไม่เปิด ให้ก๊อปปี้ลิงก์ `http://localhost:5173` ไปแปะใน Chrome)
- **ทำตามคำแนะนำในหน้าจอ**: ระบบจะถามคำถามคุณทีละข้อ แค่กรอกข้อมูลตามที่มันบอก
- **จุดสำคัญ**: เมื่อถึงหน้าสุดท้าย กดปุ่มสีม่วงๆ **"Deploy Now"** ตัวโปรแกรมจะจัดการเขียนไฟล์การตั้งค่าให้, สั่งรันบอทให้ และจะส่งหน้าจอ **Dashboard** กับ **Terminal UI** มาให้คุณใช้งานทันที สะดวกสุดๆ ครับ!

---

## 🚀 การเริ่มต้นใช้งาน

### สิ่งที่ต้องมีก่อนเริ่ม

- **Node.js**: เวอร์ชั่น 22.0.0 หรือสูงกว่า
- **OpenClaw CLI**: แนะนำให้ติดตั้งเพื่อให้ระบบ Deploy ทำงานได้สมบูรณ์

  ```bash
  npm install -g openclaw@latest
  ```

### ขั้นตอนการติดตั้ง

1. คลอนโปรเจกต์ (Clone repository):

   ```bash
   git clone https://github.com/openkrab/ClawWizard.git
   cd ClawWizard
   ```

2. ติดตั้ง Dependencies:

   ```bash
   npm install
   ```

3. รันในโหมดพัฒนา (Development mode):

   ```bash
   npm run dev
   ```

   *คำสั่งนี้จะรันทั้ง Vite frontend และ Node.js bridge พร้อมกัน*

4. **รันเป็นแอปเดสก์ท็อป (Native App):**

   ```bash
   # ตรวจสอบว่าคุณมี Rust ในเครื่องแล้ว
   npm install
   npx tauri dev
   ```

### 🐳 การใช้งานผ่าน Docker (ทางเลือก)

หากคุณต้องการรัน ClawWizard ผ่าน Container:

1. **สร้างและรัน**:

   ```bash
   docker-compose up -d
   ```

2. **เข้าใช้งาน**:
   เปิด [http://localhost:5173](http://localhost:5173) ผ่านเบราว์เซอร์ของคุณ

> [!NOTE]
> ระบบ Docker จะทำการเชื่อมโยง (Mount) โฟลเดอร์ `~/.openclaw` อัตโนมัติเพื่อให้การตั้งค่าของคุณยังคงอยู่แม้จะลบ Container ไปแล้ว

---

1. เปิดเบราว์เซอร์ไปที่ [http://localhost:5173](http://localhost:5173)

---

## 📸 ภาพหน้าจอการใช้งาน (Screenshots)

<p align="center">
  <img src="assets/step1_welcome.png" width="400" alt="Step 1: Welcome">
  <img src="assets/step2_model.png" width="400" alt="Step 2: Model Auth">
  <img src="assets/step3_workspace.png" width="400" alt="Step 3: Workspace">
  <img src="assets/step4_gateway.png" width="400" alt="Step 4: Gateway">
  <img src="assets/step5_channels.png" width="400" alt="Step 5: Channels">
  <img src="assets/step6_tools.png" width="400" alt="Step 6: Tools">
</p>

---

*ขับเคลื่อนโดยวิถีกุ้งมังกร (The Lobster Way) 🦞*
