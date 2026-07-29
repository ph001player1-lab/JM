/* =================================================================
   JET MEDIA — script.js
   Разделы файла:
     1.  Настройки отправки заявок (Google Apps Script → Telegram)
     2.  Бизнес-константы расчёта
     3.  Словари переводов (RU / EN / TH)
     4.  Утилиты (форматирование, анимация чисел, подстановка процентов)
     5.  Переключение языка
     6.  Калькулятор прибыли
     7.  Тарифы (сезонный переключатель)
     8.  Форма заявки и транспорт до Telegram
     9.  Интерфейс: шапка, меню, появление блоков
   ================================================================= */

/* =================================================================
   1. НАСТРОЙКИ ОТПРАВКИ ЗАЯВОК
   -----------------------------------------------------------------
   Основной путь: Google Apps Script.
   Заявка уходит в веб-приложение, скрипт пишет строку в Google Sheets
   и отправляет сообщение в Telegram. Токен бота лежит в свойствах
   скрипта на стороне Google и в исходники сайта не попадает.

   Сюда вставляется URL веб-приложения, который выдаёт Apps Script
   после «Развернуть → Новое развёртывание → Веб-приложение»:
   https://script.google.com/macros/s/AKfycb.../exec
   Пошаговая настройка — в файле Code.gs и в README.

   Резервный путь (если Apps Script не используется): заполните
   BOT_TOKEN и CHAT_ID, тогда сайт обратится к Bot API напрямую.
   На статическом хостинге токен при этом виден всем посетителям.
   ================================================================= */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz7yxV2TuO3Tat7WSIEZ81aTgHC_xmTK8UEL2d4wjh1AHK7b-kCXbdTS3-9XXd0kATSaw/exec";

const BOT_TOKEN = "";   // запасной вариант, обычно оставляем пустым
const CHAT_ID   = "";   // запасной вариант, обычно оставляем пустым

/* =================================================================
   2. БИЗНЕС-КОНСТАНТЫ
   ================================================================= */
/* Прирост выручки по тарифам — единственное место, где живут эти цифры.
   Отсюда считается калькулятор и подставляются все подписи с процентами:
   «Standard +6%», «Premium +10%», «+6–10% к выручке зала».
   Менять только здесь: разметку трогать не нужно.
   Ориентир брошюры «Цифровой официант» — «+6% и более» к среднему чеку.
   Значения из ТЗ, если вернётесь к ним: { std: 0.10, prm: 0.15 }. */
const UPLIFT = { std: 0.06, prm: 0.15 };

/* Снижение нагрузки на персонал. Подставляется в первый экран и в блок
   «Что получает ресторан». В брошюре заявлено «−20% и более». */
const STAFF_RELIEF = 0.20;

const PRICE = {                                     // USD за устройство в месяц
  low:  { std: 10, prm: 20 },
  high: { std: 30, prm: 60 }
};

/* =================================================================
   3. СЛОВАРИ ПЕРЕВОДОВ
   Все тексты страницы лежат здесь: чтобы добавить язык, скопируйте
   любой блок, переведите значения и добавьте кнопку в шапке.
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

    "calc.title": "Калькулятор прибыли", "calc.badge": "THB / месяц",
    "calc.tables": "Количество столиков", "calc.guests": "Посетителей в месяц", "calc.check": "Средний чек",
    "calc.current": "Текущая выручка", "calc.standard": "Standard", "calc.premium": "Premium",
    "calc.note": "Расчёт по среднему приросту чека при работе AI-рекомендаций. Итог зависит от меню и сезона.",

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
    "price.per": "/устройство в месяц", "price.free": "Первый месяц бесплатно",
    "price.all": "Всё из Standard, плюс:", "price.badge": "Максимум прибыли",
    "price.s1": "AI увеличивает продажи", "price.s2": "Мультиязычное меню и оплата",
    "price.s3": "Обслуживание оборудования", "price.s4": "Гарантийная замена устройства",
    "price.s5": "Разрешена реклама сети JET MEDIA",
    "price.p1": "Без сторонней рекламы", "price.p2": "Расширенный AI-апселл",
    "price.p3": "Расширенная аналитика", "price.p4": "Максимальная персонализация меню",
    "price.p5": "Приоритетная поддержка",
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

    "calc.title": "Profit calculator", "calc.badge": "THB / month",
    "calc.tables": "Number of tables", "calc.guests": "Guests per month", "calc.check": "Average check",
    "calc.current": "Current revenue", "calc.standard": "Standard", "calc.premium": "Premium",
    "calc.note": "Based on the average check uplift AI recommendations deliver. Actual results depend on your menu and season.",

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
    "price.per": "/device per month", "price.free": "First month free",
    "price.all": "Everything in Standard, plus:", "price.badge": "Maximum profit",
    "price.s1": "AI increases sales", "price.s2": "Multilingual menu and payments",
    "price.s3": "Equipment servicing", "price.s4": "Warranty replacement",
    "price.s5": "JET MEDIA network ads allowed",
    "price.p1": "No third-party ads", "price.p2": "Advanced AI upsell",
    "price.p3": "Advanced analytics", "price.p4": "Full menu personalisation",
    "price.p5": "Priority support",
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

    "calc.title": "เครื่องคำนวณกำไร", "calc.badge": "บาท / เดือน",
    "calc.tables": "จำนวนโต๊ะ", "calc.guests": "ลูกค้าต่อเดือน", "calc.check": "ยอดบิลเฉลี่ย",
    "calc.current": "รายได้ปัจจุบัน", "calc.standard": "Standard", "calc.premium": "Premium",
    "calc.note": "คำนวณจากยอดบิลที่เพิ่มขึ้นโดยเฉลี่ยเมื่อใช้คำแนะนำจาก AI ผลลัพธ์จริงขึ้นอยู่กับเมนูและฤดูกาล",

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
    "price.per": "/เครื่อง/เดือน", "price.free": "เดือนแรกฟรี",
    "price.all": "ทุกอย่างใน Standard และเพิ่ม:", "price.badge": "กำไรสูงสุด",
    "price.s1": "AI ช่วยเพิ่มยอดขาย", "price.s2": "เมนูหลายภาษาและการชำระเงิน",
    "price.s3": "ดูแลบำรุงรักษาอุปกรณ์", "price.s4": "เปลี่ยนเครื่องตามการรับประกัน",
    "price.s5": "อนุญาตโฆษณาของเครือข่าย JET MEDIA",
    "price.p1": "ไม่มีโฆษณาจากภายนอก", "price.p2": "AI แนะนำการขายขั้นสูง",
    "price.p3": "การวิเคราะห์ขั้นสูง", "price.p4": "ปรับแต่งเมนูได้เต็มที่",
    "price.p5": "ซัพพอร์ตแบบพิเศษ",
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
const money  = n => nf.format(Math.round(n)) + " ฿";
const plus   = n => "+" + money(n);
const plainN = n => nf.format(Math.round(n));

/* Доля → проценты: 0.06 → «6». Дробные значения вроде 0.125 покажутся как «12,5» */
const pctNum = v => pf.format(Math.round(v * 1000) / 10);

/* Подстановка процентов в разметку.
   Все элементы с data-claim берут значение из констант выше, поэтому
   цифра в дизайне и цифра в расчётах не могут разойтись.
   Вызывается при каждой смене языка — вместе с форматом чисел. */
function renderClaims(){
  const claims = {
    "uplift-std":   "+" + pctNum(UPLIFT.std) + "%",
    "uplift-prm":   "+" + pctNum(UPLIFT.prm) + "%",
    // Если тарифы дают одинаковый прирост, диапазон схлопывается в одно число
    "uplift-range": UPLIFT.std === UPLIFT.prm
      ? "+" + pctNum(UPLIFT.std) + "%"
      : "+" + pctNum(UPLIFT.std) + "–" + pctNum(UPLIFT.prm) + "%",
    "relief":       "−" + pctNum(STAFF_RELIEF) + "%"
  };
  $$("[data-claim]").forEach(el => {
    const val = claims[el.dataset.claim];
    if (val) el.textContent = val;
  });
}

/* Плавный счётчик: анимирует число от текущего к целевому.
   fmt — функция форматирования, чтобы одна анимация обслуживала
   и «1 530 000 ฿», и цену тарифа. */
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
   6. КАЛЬКУЛЯТОР ПРИБЫЛИ
   ================================================================= */
const sTables = $("#sTables"), sGuests = $("#sGuests"), sCheck = $("#sCheck");
const oTables = $("#oTables"), oGuests = $("#oGuests"), oCheck = $("#oCheck");
const rNow = $("#rNow"), rStd = $("#rStd"), rPrm = $("#rPrm");

/* Заливка дорожки ползунка через CSS-переменную */
function paintRange(input){
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty("--p", pct + "%");
}

/* Главный пересчёт. instant = true — без анимации (например, при смене языка) */
function recalc(instant){
  const tables = +sTables.value;
  const guests = +sGuests.value;
  const check  = +sCheck.value;

  const revenue = guests * check;

  oTables.textContent = plainN(tables);
  oGuests.textContent = plainN(guests);
  oCheck.textContent  = money(check);
  [sTables, sGuests, sCheck].forEach(paintRange);

  const dur = instant ? 0 : 650;
  animateNumber(rNow, revenue, money, dur);
  animateNumber(rStd, revenue * UPLIFT.std, plus, dur);
  animateNumber(rPrm, revenue * UPLIFT.prm, plus, dur);
}

[sTables, sGuests, sCheck].forEach(inp => inp.addEventListener("input", () => recalc(false)));

/* =================================================================
   7. ТАРИФЫ — переключение сезона
   ================================================================= */
let season = "low";

function renderPrices(instant){
  const dur = instant || reduceMotion ? 0 : 400;
  animateNumber($("#priceStd"), PRICE[season].std, v => String(Math.round(v)), dur);
  animateNumber($("#pricePrm"), PRICE[season].prm, v => String(Math.round(v)), dur);
}

$$("[data-season]").forEach(btn => {
  btn.addEventListener("click", () => {
    season = btn.dataset.season;
    $$("[data-season]").forEach(b => b.classList.toggle("is-active", b === btn));
    renderPrices(false);
  });
});

/* =================================================================
   8. ФОРМА ЗАЯВКИ И ТРАНСПОРТ ДО TELEGRAM
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

/**
 * Отправка заявки в Google Apps Script.
 *
 * Почему GET, а не POST.
 * Веб-приложение Apps Script на POST отвечает редиректом на
 * script.googleusercontent.com. Браузеры (особенно WebView внутри
 * Telegram) на этом редиректе теряют preflight-запрос CORS, и заявка
 * не доходит. GET с параметрами в строке запроса обходит проблему:
 * preflight не нужен, ответ читается, можно показать пользователю
 * честный результат. Данных мало, в лимит длины URL укладываемся.
 *
 * Если GET по какой-то причине не прошёл, пробуем POST в режиме
 * no-cors: ответ прочитать нельзя, но строка в таблице появится и
 * сообщение в Telegram уйдёт.
 *
 * @param {object} payload — поля заявки и снимок калькулятора
 * @returns {Promise<boolean>} успех отправки
 */
async function sendViaAppsScript(payload){
  const url = APPS_SCRIPT_URL + "?" + new URLSearchParams(payload).toString();
  try {
    const res  = await fetch(url, { method: "GET", redirect: "follow" });
    const data = await res.json();
    if (!data.ok) console.error("Apps Script:", data);
    return data.ok === true;
  } catch (err) {
    console.warn("GET не прошёл, пробуем POST no-cors:", err);
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        // text/plain не вызывает preflight; Apps Script разберёт тело как JSON
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (err2) {
      console.error("POST тоже не прошёл:", err2);
      return false;
    }
  }
}

/**
 * Резервный путь: прямой вызов Telegram Bot API из браузера.
 * Работает без Apps Script, но токен виден в исходниках сайта.
 */
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
    `Средний чек: ${payload.check} THB\n` +
    `Язык сайта: ${String(payload.lang).toUpperCase()}`;

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true })
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) console.error("Telegram API:", data);
  return Boolean(data.ok);
}

/* Выбор транспорта: Apps Script → прямой Bot API → ничего */
async function sendLead(payload){
  if (APPS_SCRIPT_URL && !APPS_SCRIPT_URL.startsWith("PASTE")) return sendViaAppsScript(payload);
  if (BOT_TOKEN && CHAT_ID) return sendDirectToTelegram(payload);
  console.warn("JET MEDIA: не задан APPS_SCRIPT_URL — заявка никуда не ушла.");
  return false;
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const dict = I18N[lang];

  const name  = $("#fName").value.trim();
  const phone = $("#fPhone").value.trim();
  const rest  = $("#fRest").value.trim();
  const trap  = $("#fTrap").value;           // honeypot: заполнен — это бот

  if (trap){ form.reset(); return; }         // тихо игнорируем бота

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

  // Снимок калькулятора уходит вместе с заявкой: менеджер видит
  // ожидания клиента ещё до первого звонка
  const tables = +sTables.value, guests = +sGuests.value, check = +sCheck.value;
  const revenue = guests * check;

  const payload = {
    type: requestType,
    name, phone,
    restaurant: rest,
    tables, guests, check,
    revenue: Math.round(revenue),
    addStd: Math.round(revenue * UPLIFT.std),
    addPrm: Math.round(revenue * UPLIFT.prm),
    lang,
    page: location.href
  };

  submitBtn.disabled = true;
  statusEl.className = "form-status";
  statusEl.textContent = dict["form.sending"];

  try {
    const ok = await sendLead(payload);
    if (ok){
      statusEl.textContent = dict["form.ok"];
      statusEl.className = "form-status ok";
      form.reset();
      $$(".inp").forEach(i => i.classList.remove("err"));
    } else {
      statusEl.textContent = dict["form.errNet"];
      statusEl.className = "form-status bad";
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
   Язык: сохранённый → язык браузера → русский
   ================================================================= */
(function init(){
  let saved = null;
  try { saved = localStorage.getItem("jm_lang"); } catch (e) {}
  const browser = (navigator.language || "ru").slice(0, 2).toLowerCase();
  applyLang(saved || (I18N[browser] ? browser : "ru"));
})();
