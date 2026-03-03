import { useWizard } from "./context/WizardContext";

const translations = {
  en: {
    setup_title: "Environment Setup ⚙️",
    setup_subtitle:
      "Before we begin, let's make sure you have the OpenClaw engine installed on your system.",
    checking_system: "Checking system... ⏳",
    openclaw_installed: "OpenClaw is Installed",
    openclaw_not_found: "OpenClaw Not Found",
    version: "Version",
    node: "Node",
    install_to_proceed:
      "You need to install the OpenClaw CLI to proceed with the setup.",
    recheck_status: "🔄 Recheck Status",
    installing_wait: "⏳ Installing... Please wait",
    install_auto: "✨ Install OpenClaw Automatically",
    manual_guide_title: "📦 Manual Install Guide (Fallback)",
    manual_guide_desc:
      "If the automatic installation fails, try running one of these commands on your terminal.",
    or_use_npm: "Or simply use npm:",
    btn_continue: "Continue →",
    waiting_install: "Waiting for installation...",
    install_failed: "Install failed. Please try manual installation.",
    error_install: "Error during install: ",
    alert_install_first: "Please install OpenClaw first!",

    // Welcome Page
    welcome_title: "Welcome to",
    welcome_subtitle:
      "Set up your OpenClaw personal AI assistant in minutes. Choose your use case to get started with tailored recommendations.",
    cost: "Cost:",
    recommended_templates: "📦 Recommended Templates",
    one_click_presets:
      "One-click presets for your use case. You can customize everything in the next steps.",

    // Use Cases Titles
    uc_personal_title: "Personal Assistant",
    uc_personal_desc: "Daily tasks, reminders, Q&A, and life management",
    uc_coding_title: "Coding Helper",
    uc_coding_desc: "Code writing, debugging, file management, and docs lookup",
    uc_content_title: "Content Creator",
    uc_content_desc: "Writing, editing, social media, and creative work",
    uc_automation_title: "Automation & Scraping",
    uc_automation_desc: "Web scraping, browser automation, and scheduled tasks",
    uc_trading_title: "Trading Bot",
    uc_trading_desc: "Market data, analysis, alerts, and portfolio tracking",
    uc_research_title: "Research Agent",
    uc_research_desc: "Deep web research, summarization, and report generation",
    uc_custom_title: "Custom Setup",
    uc_custom_desc: "Start from scratch and configure everything yourself",

    // Cost Levels
    cost_low: "Low",
    cost_medium: "Medium",
    cost_high: "High",
    cost_varies: "Varies",
  },
  th: {
    setup_title: "เตรียมความพร้อม ⚙️",
    setup_subtitle:
      "ก่อนจะเริ่มกัน เรามาตรวจสอบกันก่อนว่าเครื่องของคุณติดตั้งระบบ OpenClaw ไว้หรือยัง",
    checking_system: "กำลังตรวจสอบระบบ... ⏳",
    openclaw_installed: "ติดตั้ง OpenClaw เรียบร้อยแล้ว",
    openclaw_not_found: "ไม่พบ OpenClaw บนเครื่อง",
    version: "เวอร์ชัน",
    node: "ระบบ Node",
    install_to_proceed: "คุณจำเป็นต้องติดตั้ง OpenClaw CLI เพื่อดำเนินการต่อ",
    recheck_status: "🔄 ตรวจสอบเช็คอีกครั้ง",
    installing_wait: "⏳ กำลังติดตั้ง... โปรดรอสักครู่",
    install_auto: "✨ ติดตั้ง OpenClaw อัตโนมัติ",
    manual_guide_title: "📦 วิธีติดตั้งด้วยตัวเอง (สำรอง)",
    manual_guide_desc:
      "ถ้าติดตั้งอัตโนมัติไม่ผ่าน ลองก็อปคำสั่งพวกนี้ไปรันใน Terminal ดูนะ",
    or_use_npm: "หรือใช้คำสั่ง npm ง่ายๆ:",
    btn_continue: "ดำเนินการต่อ →",
    waiting_install: "รอการติดตั้งสักครู่...",
    install_failed: "การติดตั้งอัตโนมัติล้มเหลว โปรดลองติดตั้งด้วยตัวเอง",
    error_install: "เกิดข้อผิดพลาดระหว่างติดตั้ง: ",
    alert_install_first: "โปรดติดตั้ง OpenClaw ก่อนดำเนินการต่อ!",

    // Welcome Page
    welcome_title: "ยินดีต้อนรับสู่",
    welcome_subtitle:
      "ตั้งค่าผู้ช่วย AI ส่วนตัว OpenClaw ของคุณในไม่กี่นาที เลือกรูปแบบการใช้งานเพื่อเริ่มต้นด้วยเทมเพลตที่เหมาะกับคุณที่สุด",
    cost: "ค่าใช้จ่าย:",
    recommended_templates: "📦 เทมเพลตที่แนะนำ",
    one_click_presets:
      "เทมเพลตสำเร็จรูปคลิกเดียวจบ คุณสามารถเข้าไปปรับแต่งแบบละเอียดได้ในขั้นตอนถัดไป",

    // Use Cases Titles
    uc_personal_title: "ผู้ช่วยส่วนตัว",
    uc_personal_desc: "ช่วยงานทั่วไป แจ้งเตือน ตอบคำถาม และจัดการชีวิตประจำวัน",
    uc_coding_title: "ผู้ช่วยเขียนโค้ด",
    uc_coding_desc: "เขียนโค้ด แก้บั๊ก จัดการไฟล์ และค้นหาเอกสารโปรแกรมเมอร์",
    uc_content_title: "สร้างสรรค์คอนเทนต์",
    uc_content_desc:
      "เขียนบทความ พิสูจน์อักษร แต่งสเตตัสโซเชียล และงานเขียนอื่นๆ",
    uc_automation_title: "ดึงข้อมูล & ออโตเมชั่น",
    uc_automation_desc:
      "สายสคริปต์ ดึงข้อมูลเว็บ สั่งรันบอทเบราว์เซอร์ และตั้งเวลาทำงาน",
    uc_trading_title: "บอทเทรดหุ้น/คริปโต",
    uc_trading_desc: "ดูราคาตลาด วิเคราะห์กราฟ แจ้งเตือนราคา และแทร็กพอร์ต",
    uc_research_title: "ผู้ช่วยนักวิจัย",
    uc_research_desc: "ค้นคว้าข้อมูลเชิงลึกบนเน็ต สรุปเนื้อหา และสร้างรายงาน",
    uc_custom_title: "ปรับแต่งแบบอิสระ",
    uc_custom_desc: "เริ่มจากศูนย์และปรับแต่งทุกอย่างด้วยตัวเอง",

    // Cost Levels
    cost_low: "ต่ำ",
    cost_medium: "ปานกลาง",
    cost_high: "สูง",
    cost_varies: "ไม่แน่นอน",
  },
};

export function useTranslation() {
  const { state } = useWizard();
  const lang = state.lang || "en";

  const t = (key) => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  return { t, lang };
}
