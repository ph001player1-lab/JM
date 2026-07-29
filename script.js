/* =================================================================
   JET MEDIA — script.js

   ВСЁ, ЧТО МЕНЯЕТСЯ РУКАМИ, ЛЕЖИТ В БЛОКЕ CONFIG НИЖЕ.
   Проценты, цены, курс, диапазоны ползунков и адрес приёма заявок —
   поменяли значение в CONFIG, и оно разошлось по всей странице:
   и в расчёты, и в подписи. В разметке цифр нет.

   Разделы файла:
     1.  CONFIG — все настройки
     2.  Диагностика
     3.  Словари переводов (RU / EN / TH)
     4.  Утилиты
     5.  Переключение языка
     6.  Калькулятор: прирост, расходы, чистый результат
     7.  Тарифы
     8.  Форма заявки и отправка через Google Apps Script
     9.  Интерфейс
   ================================================================= */

/* =================================================================
   1. CONFIG
   ================================================================= */
const CONFIG = {

  /* --- Адрес приёма заявок ---------------------------------------
     URL веб-приложения Google Apps Script, он же выдаётся после
     «Развернуть → Новое развёртывание → Веб-приложение».
     Заканчивается на /exec, а не на /dev.
     Настройка скрипта — в файле Code.gs и в README.             */
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbzgexRZOoFHQC3JDfa6Z-Gfg4-Kp61lVLsLtU5ungWhcncnaDa60UAxCrlud0gfrBXl9A/exec",

  /* --- Прирост выручки, % ----------------------------------------
     Обычные проценты, не доли: 6 — это 6%, 15 — это 15%.
     Отсюда считается калькулятор и подставляются все подписи:
     «Standard +6%», «Premium +15%», «+6–15% к выручке зала».     */
  uplift: {
    standard: 6,
    premium: 15
  },

  /* --- Снижение нагрузки на персонал, % --------------------------
     Показывается на первом экране и в блоке «Что получает ресторан». */
  staffRelief: 20,

  /* --- Срок запуска ----------------------------------------------
     Только цифры: слово «дня» берётся из перевода.               */
  launchDays: "1–3",

  /* --- Аренда одного устройства, USD в месяц ---------------------
     Используется и в тарифах, и в расходах калькулятора.          */
  price: {
    low:  { standard: 10, premium: 20 },   // низкий сезон
    high: { standard: 30, premium: 60 }    // высокий сезон
  },

  /* --- Курс для пересчёта аренды в баты --------------------------- */
  usdToThb: 36,

  /* --- Символ валюты результатов ---------------------------------- */
  currency: "฿",

  /* --- Ползунки калькулятора --------------------------------------
     Меняйте границы и значения по умолчанию здесь: разметка
     подстроится сама.                                             */
  sliders: {
    tables: { min: 5,   max: 50,    step: 1,  value: 20   },
    guests: { min: 200, max: 15000, step: 50, value: 1800 },
    check:  { min: 100, max: 5000,  step: 10, value: 850  }
  },

  /* --- Что показывать при первой загрузке -------------------------
     period: "month" или "year"; season: "low" или "high".        */
  defaultPeriod: "month",
  defaultSeason: "low",

  /* --- Диагностика -------------------------------------------------
     true — подробные логи в консоли браузера (F12 → Console).
     Логи включаются также адресом вида index.html?debug=1        */
  debug: false,

  /* --- Резервный путь отправки, если Apps Script не используется ---
     Прямой вызов Bot API из браузера. Токен при этом виден всем
     посетителям сайта, поэтому по умолчанию пусто.               */
  botToken: "",
  chatId: ""
};

/* =================================================================
   2. ДИАГНОСТИКА
   ================================================================= */
const DEBUG = CONFIG.debug || location.search.indexOf("debug=1") !== -1;
const log = (...args) => { if (DEBUG) console.log("%cJET MEDIA", "color:#46C7FF", ...args); };

/* =================================================================
   3. СЛОВАРИ ПЕРЕВОДОВ
   Чтобы добавить язык: скопируйте блок, переведите значения,
   добавьте кнопку в шапке и локаль в LOCALES.
   ================================================================= */
const I18N = {

  ru: {
    "meta.title": "JET MEDIA — цифровой официант для ресторанов. Дополнительная выручка без найма персонала",
    "meta.desc": "JET MEDIA устанавливает планшеты-официанты на столы ресторана: AI-апселл, мультиязычное меню, оплата со стола, отзывы и аналитика продаж.",

    "nav.calc": "Калькулятор", "nav.ops": "Возможности",
    "nav.pricing": "Тарифы", "nav.faq": "Вопросы", "nav.cta": "Демонстрация",

    "hero.eyebrow": "Цифровой официант на каждом столе",
    "hero.title1": "Дополнительная выручка", "hero.title2": "без найма персонала",
    "hero.ctaDemo": "Заказать демонстрацию", "hero.ctaInstall": "Заказать установку",
    "hero.t1": "к выручке зала", "hero.t2": "нагрузки на персонал", "hero.t3": "дня на запуск",

    "calc.title": "Калькулятор прибыли",
    "calc.month": "Месяц", "calc.year": "Год",
    "calc.tables": "Количество столиков", "calc.guests": "Посетителей в месяц", "calc.check": "Средний чек",
    "calc.season": "Сезон аренды",
    "calc.current": "Текущая выручка",
    "calc.standard": "Standard", "calc.premium": "Premium",
    "calc.gain": "Прирост выручки", "calc.rent": "Аренда оборудования", "calc.net": "Чистый результат",

    "ops.eyebrow": "Что получает ресторан",
    "ops.title": "Не только продажи — вся операционка стола",
    "ops.c1t": "Нагрузки на персонал",
    "ops.c1d": "Устройство знакомит с меню, отвечает на вопросы, помогает оформить заказ, вызывает официанта и помогает с оплатой. Команда занимается качеством сервиса, а не рутиной.",
    "ops.c2t": "Полная совместимость с вашей системой",
    "ops.c2d": "Заказы автоматически передаются на кухню, меню и цены всегда актуальны, стоп-листы синхронизируются. Привычные процессы не меняются.",
    "ops.c3t": "Встроенный Power Bank",
    "ops.c3d": "Гость заряжает телефон прямо за столом и остаётся в зале дольше. Внимание к деталям, которое замечают и о котором пишут в отзывах.",
    "ops.capsTitle": "Возможности платформы",
    "ops.f1": "Электронное меню", "ops.f2": "Заказ со стола", "ops.f3": "Вызов официанта",
    "ops.f4": "Запрос счёта", "ops.f5": "Оплата со стола", "ops.f6": "Интеграция с системой ресторана",
    "ops.f7": "Мультиязычный интерфейс", "ops.f8": "Продвижение спецпредложений",
    "ops.f9": "Программа лояльности", "ops.f10": "Получение отзывов",
    "ops.f11": "Аналитика продаж", "ops.f12": "Удалённое управление контентом",

    "price.eyebrow": "Тарифы", "price.title": "Два тарифа",
    "price.sub": "Цена указана за одно устройство в месяц.",
    "price.low": "Низкий сезон", "price.high": "Высокий сезон",
    "price.per": "/устройство в месяц",
    "price.all": "Всё из Standard, плюс:", "price.badge": "Максимум прибыли",
    "price.s1": "Электронное меню",
    "price.s2": "Вызов официанта",
    "price.s3": "Запрос счёта",
    "price.s4": "Мультиязычный интерфейс",
    "price.s5": "Обслуживание оборудования",
    "price.s6": "Гарантийная замена устройства",
    "price.s7": "Реклама сети JET MEDIA",
    "price.p1": "Заказ со стола",
    "price.p2": "Оплата со стола",
    "price.p3": "Интеграция с системой ресторана",
    "price.p4": "Продвижение спецпредложений",
    "price.p5": "Программа лояльности",
    "price.p6": "Получение отзывов",
    "price.p7": "Расширенная аналитика продаж",
    "price.p8": "Удалённое управление контентом",
    "price.p9": "Без сторонней рекламы",
    "price.ctaStd": "Заказать установку", "price.ctaPrm": "Заказать демонстрацию",

    "faq.eyebrow": "Вопросы", "faq.title": "Что важно знать до установки",
    "faq.q1": "Что делать, если устройство сломалось?",
    "faq.a1": "При гарантийном случае меняем бесплатно. Если повреждение произошло по вине клиента, ремонт оплачивается отдельно.",
    "faq.q2": "Нужно ли менять кассовую систему?",
    "faq.a2": "Нет. Мы интегрируемся с вашей системой управления: заказы уходят на кухню, меню, цены и стоп-листы синхронизируются автоматически.",
    "faq.q3": "Можно ли отказаться?",
    "faq.a3": "Да, в любой момент. В конце оплаченного периода мы просто забираем оборудование.",
    "faq.q4": "Сколько занимает установка?",
    "faq.a4": "Обычно от одного до трёх дней, включая настройку меню и обучение персонала.",

    "form.title": "Оставьте заявку",
    "form.sub": "Свяжемся в течение рабочего дня, покажем систему вживую и посчитаем количество устройств для вашего зала.",
    "form.tDemo": "Демонстрация", "form.tInstall": "Установка",
    "form.name": "Имя", "form.namePh": "Как к вам обращаться",
    "form.phone": "Телефон", "form.phonePh": "+66 XX XXX XXXX",
    "form.rest": "Название ресторана", "form.restPh": "Например, Sunset Beach Cafe",
    "form.send": "Отправить заявку",
    "form.hint": "Нажимая кнопку, вы соглашаетесь на обработку контактных данных для связи по заявке.",
    "form.sending": "Отправляем…",
    "form.ok": "Заявка отправлена. Свяжемся с вами в течение рабочего дня.",
    "form.errFields": "Заполните имя, телефон и название ресторана.",
    "form.errPhone": "Проверьте номер телефона.",
    "form.errNet": "Не удалось отправить. Попробуйте ещё раз через минуту.",

    "foot.tag": "Цифровой официант, реклама и аналитика для ресторанов."
  },

  en: {
    "meta.title": "JET MEDIA — a digital waiter for restaurants. More revenue without hiring",
    "meta.desc": "JET MEDIA installs digital-waiter tablets on your restaurant tables: AI upsell, multilingual menu, payment from the table, reviews and sales analytics.",

    "nav.calc": "Calculator", "nav.ops": "Features",
    "nav.pricing": "Pricing", "nav.faq": "FAQ", "nav.cta": "Book a demo",

    "hero.eyebrow": "A digital waiter on every table",
    "hero.title1": "More revenue", "hero.title2": "without hiring more staff",
    "hero.ctaDemo": "Book a demo", "hero.ctaInstall": "Request installation",
    "hero.t1": "added revenue", "hero.t2": "load on staff", "hero.t3": "days to launch",

    "calc.title": "Profit calculator",
    "calc.month": "Month", "calc.year": "Year",
    "calc.tables": "Number of tables", "calc.guests": "Guests per month", "calc.check": "Average check",
    "calc.season": "Rental season",
    "calc.current": "Current revenue",
    "calc.standard": "Standard", "calc.premium": "Premium",
    "calc.gain": "Revenue uplift", "calc.rent": "Equipment rental", "calc.net": "Net result",

    "ops.eyebrow": "What the restaurant gets",
    "ops.title": "Not just sales — the whole table operation",
    "ops.c1t": "Less load on your staff",
    "ops.c1d": "The device introduces the menu, answers questions, helps place the order, calls a server and assists with payment. Your team focuses on service quality instead of routine.",
    "ops.c2t": "Full compatibility with your system",
    "ops.c2d": "Orders go straight to the kitchen, menu and prices stay current, stop-lists sync automatically. Your existing processes stay the same.",
    "ops.c3t": "Built-in power bank",
    "ops.c3d": "Guests charge their phone right at the table and stay longer. The kind of detail people notice and mention in reviews.",
    "ops.capsTitle": "Platform capabilities",
    "ops.f1": "Digital menu", "ops.f2": "Order from the table", "ops.f3": "Call a server",
    "ops.f4": "Request the bill", "ops.f5": "Pay from the table", "ops.f6": "Integration with your POS",
    "ops.f7": "Multilingual interface", "ops.f8": "Promoting special offers",
    "ops.f9": "Loyalty programme", "ops.f10": "Collecting reviews",
    "ops.f11": "Sales analytics", "ops.f12": "Remote content management",

    "price.eyebrow": "Pricing", "price.title": "Two plans",
    "price.sub": "Price is per device per month.",
    "price.low": "Low season", "price.high": "High season",
    "price.per": "/device per month",
    "price.all": "Everything in Standard, plus:", "price.badge": "Maximum profit",
    "price.s1": "Digital menu",
    "price.s2": "Call a server",
    "price.s3": "Request the bill",
    "price.s4": "Multilingual interface",
    "price.s5": "Equipment servicing",
    "price.s6": "Warranty replacement",
    "price.s7": "JET MEDIA network ads",
    "price.p1": "Order from the table",
    "price.p2": "Pay from the table",
    "price.p3": "Integration with your POS",
    "price.p4": "Promoting special offers",
    "price.p5": "Loyalty programme",
    "price.p6": "Collecting reviews",
    "price.p7": "Advanced sales analytics",
    "price.p8": "Remote content management",
    "price.p9": "No third-party ads",
    "price.ctaStd": "Request installation", "price.ctaPrm": "Book a demo",

    "faq.eyebrow": "FAQ", "faq.title": "What to know before installation",
    "faq.q1": "What if a device breaks?",
    "faq.a1": "Warranty cases are replaced free of charge. Damage caused by the client is repaired at extra cost.",
    "faq.q2": "Do I need to change my POS system?",
    "faq.a2": "No. We integrate with your management system: orders go to the kitchen, menu, prices and stop-lists sync automatically.",
    "faq.q3": "Can I cancel?",
    "faq.a3": "Yes, at any time. At the end of the paid period we simply collect the equipment.",
    "faq.q4": "How long does installation take?",
    "faq.a4": "Usually one to three days, including menu setup and staff training.",

    "form.title": "Send a request",
    "form.sub": "We'll get back to you within one business day, show the system live and calculate how many devices your floor needs.",
    "form.tDemo": "Demo", "form.tInstall": "Installation",
    "form.name": "Name", "form.namePh": "How should we address you",
    "form.phone": "Phone", "form.phonePh": "+66 XX XXX XXXX",
    "form.rest": "Restaurant name", "form.restPh": "e.g. Sunset Beach Cafe",
    "form.send": "Send request",
    "form.hint": "By sending the form you agree that we may use your contact details to reply to this request.",
    "form.sending": "Sending…",
    "form.ok": "Request sent. We'll contact you within one business day.",
    "form.errFields": "Please fill in name, phone and restaurant name.",
    "form.errPhone": "Please check the phone number.",
    "form.errNet": "Sending failed. Please try again in a minute.",

    "foot.tag": "Digital waiter, advertising and analytics for restaurants."
  },

  th: {
    "meta.title": "JET MEDIA — พนักงานเสิร์ฟดิจิทัลสำหรับร้านอาหาร เพิ่มรายได้โดยไม่ต้องจ้างพนักงานเพิ่ม",
    "meta.desc": "JET MEDIA ติดตั้งแท็บเล็ตพนักงานเสิร์ฟดิจิทัลบนโต๊ะร้านอาหาร ทั้งการแนะนำเมนูด้วย AI เมนูหลายภาษา ชำระเงินจากโต๊ะ รีวิว และการวิเคราะห์ยอดขาย",

    "nav.calc": "คำนวณกำไร", "nav.ops": "ความสามารถ",
    "nav.pricing": "แพ็กเกจ", "nav.faq": "คำถามที่พบบ่อย", "nav.cta": "ขอชมการสาธิต",

    "hero.eyebrow": "พนักงานเสิร์ฟดิจิทัลบนทุกโต๊ะ",
    "hero.title1": "รายได้เพิ่มขึ้น", "hero.title2": "โดยไม่ต้องจ้างพนักงานเพิ่ม",
    "hero.ctaDemo": "ขอชมการสาธิต", "hero.ctaInstall": "ขอติดตั้ง",
    "hero.t1": "รายได้ที่เพิ่มขึ้น", "hero.t2": "ภาระงานของพนักงาน", "hero.t3": "วันในการเริ่มใช้งาน",

    "calc.title": "เครื่องคำนวณกำไร",
    "calc.month": "เดือน", "calc.year": "ปี",
    "calc.tables": "จำนวนโต๊ะ", "calc.guests": "ลูกค้าต่อเดือน", "calc.check": "ยอดบิลเฉลี่ย",
    "calc.season": "ฤดูกาลเช่า",
    "calc.current": "รายได้ปัจจุบัน",
    "calc.standard": "Standard", "calc.premium": "Premium",
    "calc.gain": "รายได้ที่เพิ่มขึ้น", "calc.rent": "ค่าเช่าอุปกรณ์", "calc.net": "ผลลัพธ์สุทธิ",

    "ops.eyebrow": "สิ่งที่ร้านได้รับ",
    "ops.title": "ไม่ใช่แค่ยอดขาย แต่คือการดำเนินงานทั้งโต๊ะ",
    "ops.c1t": "ภาระงานของพนักงาน",
    "ops.c1d": "อุปกรณ์แนะนำเมนู ตอบคำถาม ช่วยสั่งอาหาร เรียกพนักงาน และช่วยเรื่องการชำระเงิน ทีมงานจึงมีเวลาดูแลคุณภาพบริการแทนงานประจำ",
    "ops.c2t": "เข้ากันได้เต็มที่กับระบบของคุณ",
    "ops.c2d": "ออร์เดอร์ส่งเข้าครัวอัตโนมัติ เมนูและราคาอัปเดตเสมอ สต็อปลิสต์ซิงก์ให้เอง กระบวนการเดิมของร้านไม่ต้องเปลี่ยน",
    "ops.c3t": "พาวเวอร์แบงก์ในตัว",
    "ops.c3d": "ลูกค้าชาร์จโทรศัพท์ได้ที่โต๊ะและอยู่ในร้านนานขึ้น เป็นรายละเอียดที่ลูกค้าสังเกตเห็นและพูดถึงในรีวิว",
    "ops.capsTitle": "ความสามารถของแพลตฟอร์ม",
    "ops.f1": "เมนูอิเล็กทรอนิกส์", "ops.f2": "สั่งอาหารจากโต๊ะ", "ops.f3": "เรียกพนักงาน",
    "ops.f4": "ขอใบเสร็จ", "ops.f5": "ชำระเงินจากโต๊ะ", "ops.f6": "เชื่อมต่อกับระบบร้าน",
    "ops.f7": "อินเทอร์เฟซหลายภาษา", "ops.f8": "โปรโมตข้อเสนอพิเศษ",
    "ops.f9": "โปรแกรมสะสมคะแนน", "ops.f10": "เก็บรีวิวจากลูกค้า",
    "ops.f11": "วิเคราะห์ยอดขาย", "ops.f12": "จัดการเนื้อหาจากระยะไกล",

    "price.eyebrow": "แพ็กเกจ", "price.title": "สองแพ็กเกจ",
    "price.sub": "ราคาต่อหนึ่งเครื่องต่อเดือน",
    "price.low": "โลว์ซีซัน", "price.high": "ไฮซีซัน",
    "price.per": "/เครื่อง/เดือน",
    "price.all": "ทุกอย่างใน Standard และเพิ่ม:", "price.badge": "กำไรสูงสุด",
    "price.s1": "เมนูอิเล็กทรอนิกส์",
    "price.s2": "เรียกพนักงาน",
    "price.s3": "ขอใบเสร็จ",
    "price.s4": "อินเทอร์เฟซหลายภาษา",
    "price.s5": "ดูแลบำรุงรักษาอุปกรณ์",
    "price.s6": "เปลี่ยนเครื่องตามการรับประกัน",
    "price.s7": "โฆษณาของเครือข่าย JET MEDIA",
    "price.p1": "สั่งอาหารจากโต๊ะ",
    "price.p2": "ชำระเงินจากโต๊ะ",
    "price.p3": "เชื่อมต่อกับระบบร้าน",
    "price.p4": "โปรโมตข้อเสนอพิเศษ",
    "price.p5": "โปรแกรมสะสมคะแนน",
    "price.p6": "เก็บรีวิวจากลูกค้า",
    "price.p7": "วิเคราะห์ยอดขายขั้นสูง",
    "price.p8": "จัดการเนื้อหาจากระยะไกล",
    "price.p9": "ไม่มีโฆษณาจากภายนอก",
    "price.ctaStd": "ขอติดตั้ง", "price.ctaPrm": "ขอชมการสาธิต",

    "faq.eyebrow": "คำถามที่พบบ่อย", "faq.title": "สิ่งที่ควรรู้ก่อนติดตั้ง",
    "faq.q1": "ถ้าอุปกรณ์เสียต้องทำอย่างไร",
    "faq.a1": "หากอยู่ในการรับประกัน เราเปลี่ยนให้ฟรี หากเสียหายจากการใช้งานของลูกค้า คิดค่าซ่อมแยกต่างหาก",
    "faq.q2": "ต้องเปลี่ยนระบบ POS หรือไม่",
    "faq.a2": "ไม่ต้อง เราเชื่อมต่อกับระบบจัดการเดิมของคุณ ออร์เดอร์ส่งเข้าครัว เมนู ราคา และสต็อปลิสต์ซิงก์อัตโนมัติ",
    "faq.q3": "ยกเลิกได้หรือไม่",
    "faq.a3": "ได้ทุกเมื่อ เมื่อสิ้นสุดรอบที่ชำระแล้ว เราเข้าไปรับอุปกรณ์คืน",
    "faq.q4": "ติดตั้งใช้เวลานานเท่าไร",
    "faq.a4": "โดยทั่วไป 1–3 วัน รวมการตั้งค่าเมนูและอบรมพนักงาน",

    "form.title": "ส่งคำขอ",
    "form.sub": "เราจะติดต่อกลับภายในหนึ่งวันทำการ สาธิตระบบให้ดูจริง และคำนวณจำนวนเครื่องที่ร้านของคุณต้องใช้",
    "form.tDemo": "ชมการสาธิต", "form.tInstall": "ติดตั้ง",
    "form.name": "ชื่อ", "form.namePh": "เราควรเรียกคุณว่าอะไร",
    "form.phone": "เบอร์โทร", "form.phonePh": "+66 XX XXX XXXX",
    "form.rest": "ชื่อร้านอาหาร", "form.restPh": "เช่น Sunset Beach Cafe",
    "form.send": "ส่งคำขอ",
    "form.hint": "เมื่อกดส่ง ถือว่าคุณยินยอมให้เราใช้ข้อมูลติดต่อเพื่อตอบกลับคำขอนี้",
    "form.sending": "กำลังส่ง…",
    "form.ok": "ส่งคำขอแล้ว เราจะติดต่อกลับภายในหนึ่งวันทำการ",
    "form.errFields": "กรุณากรอกชื่อ เบอร์โทร และชื่อร้าน",
    "form.errPhone": "กรุณาตรวจสอบเบอร์โทร",
    "form.errNet": "ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้งในอีกสักครู่",

    "foot.tag": "พนักงานเสิร์ฟดิจิทัล โฆษณา และการวิเคราะห์สำหรับร้านอาหาร"
  }
};

/* =================================================================
   4. УТИЛИТЫ
   ================================================================= */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const LOCALES = { ru: "ru-RU", en: "en-US", th: "th-TH" };
let lang = "ru";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let nf = new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 0 });
let pf = new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 1 });

const money  = n => nf.format(Math.round(Math.abs(n))) + " " + CONFIG.currency;
const plus   = n => "+" + money(n);
const minus  = n => "−" + money(n);
const signed = n => (n < 0 ? "−" : "+") + money(n);   // «чистый результат» может уйти в минус
const plainN = n => nf.format(Math.round(n));
const pctNum = v => pf.format(Math.round(v * 10) / 10);   // 6 → «6», 12.5 → «12,5»

/* Подстановка чисел из CONFIG в разметку.
   Все элементы с data-claim берут значение отсюда, поэтому цифра
   в тексте и цифра в расчётах не могут разойтись. */
function renderClaims(){
  const u = CONFIG.uplift;
  const claims = {
    "uplift-std":   "+" + pctNum(u.standard) + "%",
    "uplift-prm":   "+" + pctNum(u.premium) + "%",
    // Если тарифы дают одинаковый прирост, диапазон схлопывается в одно число
    "uplift-range": u.standard === u.premium
      ? "+" + pctNum(u.standard) + "%"
      : "+" + pctNum(Math.min(u.standard, u.premium)) + "–" + pctNum(Math.max(u.standard, u.premium)) + "%",
    "relief":       "−" + pctNum(CONFIG.staffRelief) + "%",
    "launch-days":  CONFIG.launchDays
  };

  const targets = $$("[data-claim]");
  if (!targets.length){
    console.warn("JET MEDIA: в разметке нет элементов data-claim. " +
                 "Похоже, index.html остался от старой версии — обновите его вместе со script.js.");
  }
  targets.forEach(el => {
    const val = claims[el.dataset.claim];
    if (val) el.textContent = val;
  });
  log("подписи обновлены", claims);
}

/* Плавный счётчик от текущего значения к целевому. */
function animateNumber(el, to, fmt, duration = 650){
  const from = Number(el.dataset.v || 0);
  el.dataset.v = to;
  if (reduceMotion || from === to || duration === 0){ el.textContent = fmt(to); return; }

  cancelAnimationFrame(Number(el.dataset.raf || 0));
  const start = performance.now();
  const step = now => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);              // easeOutCubic
    el.textContent = fmt(from + (to - from) * eased);
    if (t < 1) el.dataset.raf = requestAnimationFrame(step);
  };
  el.dataset.raf = requestAnimationFrame(step);
}

/* =================================================================
   5. ПЕРЕКЛЮЧЕНИЕ ЯЗЫКА
   ================================================================= */
function applyLang(code){
  lang = I18N[code] ? code : "ru";
  const dict = I18N[lang];

  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;
  document.title = dict["meta.title"];
  const desc = $('meta[name="description"]');
  if (desc) desc.setAttribute("content", dict["meta.desc"]);

  $$("[data-i18n]").forEach(el => {
    const val = dict[el.dataset.i18n];
    if (val) el.textContent = val;
  });
  $$("[data-i18n-ph]").forEach(el => {
    const val = dict[el.dataset.i18nPh];
    if (val) el.placeholder = val;
  });

  nf = new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 0 });
  pf = new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 1 });
  $$(".lang-btn").forEach(b => b.classList.toggle("is-active", b.dataset.setLang === lang));

  renderClaims();
  recalc(true);
  renderPrices(true);

  try { localStorage.setItem("jm_lang", lang); } catch (e) { /* приватный режим — не страшно */ }
}

$$(".lang-btn").forEach(btn => btn.addEventListener("click", () => applyLang(btn.dataset.setLang)));

/* =================================================================
   6. КАЛЬКУЛЯТОР
   Считает прирост выручки, аренду оборудования и чистый результат
   для обоих тарифов — за месяц или за год, по выбранному сезону.
   ================================================================= */
const sTables = $("#sTables"), sGuests = $("#sGuests"), sCheck = $("#sCheck");
const oTables = $("#oTables"), oGuests = $("#oGuests"), oCheck = $("#oCheck");
const rNow = $("#rNow");
const rStd = $("#rStd"), costStd = $("#costStd"), netStd = $("#netStd");
const rPrm = $("#rPrm"), costPrm = $("#costPrm"), netPrm = $("#netPrm");

let period = CONFIG.defaultPeriod === "year" ? "year" : "month";
let season = CONFIG.defaultSeason === "high" ? "high" : "low";

/* Ползунки настраиваются из CONFIG, а не из разметки */
function setupSliders(){
  [["tables", sTables], ["guests", sGuests], ["check", sCheck]].forEach(([key, input]) => {
    const c = CONFIG.sliders[key];
    input.min = c.min; input.max = c.max; input.step = c.step; input.value = c.value;
  });
}

/* Заливка дорожки ползунка через CSS-переменную */
function paintRange(input){
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty("--p", pct + "%");
}

/* Главный пересчёт. instant = true — без анимации (смена языка, первый показ) */
function recalc(instant){
  const tables = +sTables.value;
  const guests = +sGuests.value;
  const check  = +sCheck.value;

  const months  = period === "year" ? 12 : 1;
  const revenue = guests * check * months;

  // Прирост выручки по тарифам
  const gainStd = revenue * CONFIG.uplift.standard / 100;
  const gainPrm = revenue * CONFIG.uplift.premium / 100;

  // Аренда: одно устройство на столик, цена по выбранному сезону
  const rentStd = tables * CONFIG.price[season].standard * CONFIG.usdToThb * months;
  const rentPrm = tables * CONFIG.price[season].premium  * CONFIG.usdToThb * months;

  oTables.textContent = plainN(tables);
  oGuests.textContent = plainN(guests);
  oCheck.textContent  = money(check);
  [sTables, sGuests, sCheck].forEach(paintRange);

  const dur = instant ? 0 : 650;
  animateNumber(rNow, revenue, money, dur);

  animateNumber(rStd, gainStd, plus, dur);
  animateNumber(costStd, rentStd, minus, dur);
  animateNumber(netStd, gainStd - rentStd, signed, dur);

  animateNumber(rPrm, gainPrm, plus, dur);
  animateNumber(costPrm, rentPrm, minus, dur);
  animateNumber(netPrm, gainPrm - rentPrm, signed, dur);

  // Отрицательный результат подсвечивается — так честнее, чем прятать
  netStd.classList.toggle("neg", gainStd - rentStd < 0);
  netPrm.classList.toggle("neg", gainPrm - rentPrm < 0);
}

[sTables, sGuests, sCheck].forEach(inp => inp.addEventListener("input", () => recalc(false)));

/* Период: месяц или год */
$$("[data-period]").forEach(btn => {
  btn.addEventListener("click", () => {
    period = btn.dataset.period;
    $$("[data-period]").forEach(b => b.classList.toggle("is-active", b.dataset.period === period));
    recalc(false);
  });
});

/* Сезон: переключатели в калькуляторе и в тарифах связаны между собой */
$$("[data-season]").forEach(btn => {
  btn.addEventListener("click", () => {
    season = btn.dataset.season;
    $$("[data-season]").forEach(b => b.classList.toggle("is-active", b.dataset.season === season));
    renderPrices(false);
    recalc(false);
  });
});

/* =================================================================
   7. ТАРИФЫ
   ================================================================= */
function renderPrices(instant){
  const dur = instant || reduceMotion ? 0 : 400;
  animateNumber($("#priceStd"), CONFIG.price[season].standard, v => String(Math.round(v)), dur);
  animateNumber($("#pricePrm"), CONFIG.price[season].premium,  v => String(Math.round(v)), dur);
}

/* =================================================================
   8. ФОРМА ЗАЯВКИ И ОТПРАВКА ЧЕРЕЗ GOOGLE APPS SCRIPT
   ================================================================= */
const form = $("#leadForm");
const statusEl = $("#formStatus");
const submitBtn = $("#submitBtn");
let requestType = "demo";     // demo | install

$$("[data-type]").forEach(btn => {
  btn.addEventListener("click", () => {
    requestType = btn.dataset.type;
    $$("[data-type]").forEach(b => b.classList.toggle("is-active", b === btn));
  });
});

/* Любая кнопка страницы может заранее выбрать тип заявки */
$$("[data-request-type]").forEach(link => {
  link.addEventListener("click", () => {
    const target = $(`[data-type="${link.dataset.requestType}"]`);
    if (target) target.click();
  });
});

const urlReady = () =>
  typeof CONFIG.appsScriptUrl === "string" &&
  CONFIG.appsScriptUrl.indexOf("script.google.com") !== -1 &&
  CONFIG.appsScriptUrl.indexOf("/exec") !== -1;

/**
 * Отправка заявки в Google Apps Script.
 *
 * Шаг 1 — GET со всеми полями в строке запроса.
 *   Такой запрос не требует preflight-проверки CORS и не ломается
 *   на редиректе Apps Script, в том числе внутри WebView Telegram.
 *   Ответ читается, поэтому пользователю показывается честный итог.
 *
 * Шаг 2 — если ответ не удалось прочитать, POST в режиме no-cors.
 *   Ответ недоступен, но строка в таблице появится и сообщение уйдёт.
 *
 * Диагностика: откройте страницу с ?debug=1 и следите за консолью,
 * либо вызовите JM.testLead() — уйдёт тестовая заявка.
 */
async function sendViaAppsScript(payload){
  const url = CONFIG.appsScriptUrl + "?" + new URLSearchParams(payload).toString();
  log("GET →", url);

  try {
    const res  = await fetch(url, { method: "GET", redirect: "follow" });
    const text = await res.text();
    log("ответ:", res.status, text.slice(0, 200));

    let data = null;
    try { data = JSON.parse(text); } catch (e) { /* пришёл не JSON */ }

    if (data && data.ok === true) return true;

    if (!data){
      console.warn("JET MEDIA: Apps Script вернул не JSON. Обычно это значит, " +
                   "что у веб-приложения нет доступа «У всех» или развёрнута старая версия.");
    } else {
      console.warn("JET MEDIA: Apps Script ответил ошибкой:", data);
    }
  } catch (err) {
    console.warn("JET MEDIA: GET-запрос не прошёл:", err);
  }

  // Запасной канал
  try {
    log("пробуем POST no-cors");
    await fetch(CONFIG.appsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      // text/plain не вызывает preflight; Apps Script разберёт тело как JSON
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err2) {
    console.error("JET MEDIA: POST тоже не прошёл:", err2);
    return false;
  }
}

/** Резервный путь: прямой вызов Bot API. Токен виден в исходниках сайта. */
async function sendDirectToTelegram(payload){
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const text =
    `<b>JET MEDIA — новая заявка</b>\n` +
    `Тип: <b>${payload.type === "install" ? "Установка" : "Демонстрация"}</b>\n` +
    `Имя: ${esc(payload.name)}\n` +
    `Телефон: ${esc(payload.phone)}\n` +
    `Ресторан: ${esc(payload.restaurant)}\n\n` +
    `Столиков: ${payload.tables}\n` +
    `Гостей в месяц: ${payload.guests}\n` +
    `Средний чек: ${payload.check} THB`;

  const res = await fetch(`https://api.telegram.org/bot${CONFIG.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CONFIG.chatId, text, parse_mode: "HTML", disable_web_page_preview: true })
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) console.error("Telegram API:", data);
  return Boolean(data.ok);
}

/* Выбор канала: Apps Script → прямой Bot API → ничего */
async function sendLead(payload){
  if (urlReady()) return sendViaAppsScript(payload);
  if (CONFIG.botToken && CONFIG.chatId) return sendDirectToTelegram(payload);

  console.error(
    "JET MEDIA: заявка никуда не ушла — в CONFIG.appsScriptUrl не указан адрес веб-приложения.\n" +
    "Ожидается ссылка вида https://script.google.com/macros/s/AKfycb.../exec"
  );
  return false;
}

/* Снимок калькулятора уходит вместе с заявкой: менеджер видит
   ожидания клиента ещё до первого звонка */
function calcSnapshot(){
  const tables = +sTables.value, guests = +sGuests.value, check = +sCheck.value;
  const revenue = guests * check;
  return {
    tables, guests, check,
    revenue: Math.round(revenue),
    addStd: Math.round(revenue * CONFIG.uplift.standard / 100),
    addPrm: Math.round(revenue * CONFIG.uplift.premium / 100),
    season, period
  };
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const dict = I18N[lang];

  const name  = $("#fName").value.trim();
  const phone = $("#fPhone").value.trim();
  const rest  = $("#fRest").value.trim();
  const trap  = $("#fTrap").value;           // honeypot: заполнен — это бот

  if (trap){ form.reset(); return; }

  [["#fName", name], ["#fPhone", phone], ["#fRest", rest]]
    .forEach(([sel, v]) => $(sel).classList.toggle("err", !v));

  if (!name || !phone || !rest){
    statusEl.textContent = dict["form.errFields"];
    statusEl.className = "form-status bad";
    return;
  }
  if (phone.replace(/\D/g, "").length < 8){
    $("#fPhone").classList.add("err");
    statusEl.textContent = dict["form.errPhone"];
    statusEl.className = "form-status bad";
    return;
  }

  const payload = Object.assign(
    { type: requestType, name, phone, restaurant: rest, lang, page: location.href },
    calcSnapshot()
  );

  submitBtn.disabled = true;
  statusEl.className = "form-status";
  statusEl.textContent = dict["form.sending"];

  try {
    const ok = await sendLead(payload);
    statusEl.textContent = ok ? dict["form.ok"] : dict["form.errNet"];
    statusEl.className = "form-status " + (ok ? "ok" : "bad");
    if (ok){
      form.reset();
      $$(".inp").forEach(i => i.classList.remove("err"));
    }
  } catch (err){
    console.error(err);
    statusEl.textContent = dict["form.errNet"];
    statusEl.className = "form-status bad";
  } finally {
    submitBtn.disabled = false;
  }
});

/* =================================================================
   9. ИНТЕРФЕЙС
   ================================================================= */
const head = $("#siteHead");
const onScroll = () => head.classList.toggle("scrolled", window.scrollY > 12);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const burger = $("#burger"), nav = $("#nav");
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(open));
});
nav.addEventListener("click", e => {
  if (e.target.tagName === "A"){
    nav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }
});

if ("IntersectionObserver" in window && !reduceMotion){
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add("in");
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  $$(".reveal").forEach(el => io.observe(el));
} else {
  $$(".reveal").forEach(el => el.classList.add("in"));
}

$("#year").textContent = new Date().getFullYear();

/* =================================================================
   СТАРТ
   ================================================================= */
(function init(){
  setupSliders();

  // Начальное состояние переключателей — из CONFIG
  $$("[data-period]").forEach(b => b.classList.toggle("is-active", b.dataset.period === period));
  $$("[data-season]").forEach(b => b.classList.toggle("is-active", b.dataset.season === season));

  let saved = null;
  try { saved = localStorage.getItem("jm_lang"); } catch (e) {}
  const browser = (navigator.language || "ru").slice(0, 2).toLowerCase();
  applyLang(saved || (I18N[browser] ? browser : "ru"));

  if (!urlReady() && !CONFIG.botToken){
    console.warn("JET MEDIA: форма заявки не настроена. Укажите CONFIG.appsScriptUrl — " +
                 "ссылку вида https://script.google.com/macros/s/AKfycb.../exec");
  }
  log("готово. Проверка отправки: JM.testLead()");
})();

/* Отладочный доступ из консоли браузера:
     JM.config             — текущие настройки
     JM.testLead()         — отправить тестовую заявку
     JM.recalc()           — пересчитать калькулятор                */
window.JM = {
  config: CONFIG,
  recalc: () => recalc(false),
  testLead: () => sendLead(Object.assign({
    type: "demo",
    name: "Тестовая заявка",
    phone: "+66 00 000 0000",
    restaurant: "Test",
    lang, page: location.href
  }, calcSnapshot())).then(ok => {
    console.log(ok ? "JET MEDIA: тестовая заявка отправлена" : "JET MEDIA: отправить не удалось");
    return ok;
  })
};
