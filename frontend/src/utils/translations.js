export const translations = {
  en: {
    // PatientForm
    welcome: "Welcome to Hospital Registration. I am Elera and I will guide you today. Hold your NRIC card in front of the camera.",
    scanNric: "Please scan your NRIC",
    holdCard: "Hold your NRIC card in front of the camera",
    scanButton: "Scan NRIC",
    confirmInfo: "Please confirm your information",
    sayYes: "Please say yes to confirm",
    symptoms: "Please tell me what symptoms you're experiencing today",
    registration: "AI Avatar Registration",
    complete: "Thank you. Your registration is complete. Please proceed to vitals collection.",
    errorHear: "I couldn't hear your symptoms clearly. Please try again.",
    errorCard: "Could not read information from the ID card. Please try again.",
    
    // PreparationPrompts
    prepareTitle: "Prepare for Your Consultation",
    prepareSubtitle: "Let's help you gather everything the doctor might need",
    symptomsTitle: "Prepare Your Symptom Details",
    symptomsMsg: "Please think about when your symptoms started, how they feel, and what makes them better or worse. This will help the doctor understand your condition better.",
    medications: "Gather Your Medications",
    medicationsMsg: "If you have any medications, supplements, or medical devices with you, please have them ready to show the doctor. Include prescription bottles and any recent test results.",
    photos: "Take Photos if Needed",
    photosMsg: "If you have any visible symptoms like rashes, swelling, or injuries, consider taking clear photos with your phone. This can help the doctor assess your condition.",
    questions: "Prepare Your Questions",
    questionsMsg: "Think of any questions you want to ask the doctor. Write them down if needed so you don't forget during your consultation.",
    markComplete: "Mark Complete",
    completed: "Completed",
    next: "Next",
    back: "Back",
    continueWaiting: "Continue to Waiting Area",
    skip: "Skip preparation and continue",
    waitTime: "Estimated wait time",
    
    // VitalsCollection
    vitalsTitle: "Vitals Collection",
    bloodPressure: "Blood Pressure (mmHg)",
    heartRate: "Heart Rate (BPM)",
    submitVitals: "Submit Vitals",
    saving: "Saving...",
    
    // Common
    speaking: "Speaking...",
    readyHelp: "Ready to help",
    minutes: "minutes"
  },
  
  zh: {
    // PatientForm
    welcome: "欢迎来到医院登记处。我是Elera，今天我将为您提供指导。请将身份证放在摄像头前。",
    scanNric: "请扫描您的身份证",
    holdCard: "请将身份证放在摄像头前",
    scanButton: "扫描身份证",
    confirmInfo: "请确认您的信息",
    sayYes: "请说\"是\"确认",
    symptoms: "请告诉我您今天有什么症状",
    registration: "AI 虚拟助手登记",
    complete: "谢谢。您的登记已完成。请继续进行生命体征检查。",
    errorHear: "我没有清楚地听到您的症状。请再试一次。",
    errorCard: "无法读取身份证信息。请再试一次。",
    
    // PreparationPrompts
    prepareTitle: "为您的咨询做准备",
    prepareSubtitle: "让我们帮您收集医生可能需要的所有信息",
    symptomsTitle: "准备您的症状详情",
    symptomsMsg: "请想想您的症状是什么时候开始的，感觉如何，什么会让它们好转或恶化。这将帮助医生更好地了解您的病情。",
    medications: "收集您的药物",
    medicationsMsg: "如果您有任何药物、补充剂或医疗设备，请准备好向医生展示。包括处方瓶和任何最近的检查结果。",
    photos: "如需要请拍照",
    photosMsg: "如果您有任何可见的症状，如皮疹、肿胀或外伤，请考虑用手机拍摄清晰的照片。这可以帮助医生评估您的病情。",
    questions: "准备您的问题",
    questionsMsg: "想想您想问医生的任何问题。如果需要，请写下来，这样您在咨询时就不会忘记。",
    markComplete: "标记完成",
    completed: "已完成",
    next: "下一步",
    back: "返回",
    continueWaiting: "继续到等候区",
    skip: "跳过准备并继续",
    waitTime: "预计等待时间",
    
    // VitalsCollection
    vitalsTitle: "生命体征采集",
    bloodPressure: "血压 (mmHg)",
    heartRate: "心率 (BPM)",
    submitVitals: "提交生命体征",
    saving: "保存中...",
    
    // Common
    speaking: "正在说话...",
    readyHelp: "准备帮助",
    minutes: "分钟"
  }
};

export const getTranslation = (key, language = 'en') => {
  return translations[language]?.[key] || translations.en[key] || key;
};