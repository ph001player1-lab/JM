/* =================================================================
   JET MEDIA — script.js
   Разделы файла:
     1.  Настройки отправки заявок (Google Apps Script → Telegram)
     2.  Бизнес-константы расчёта
     3.  Словари переводов (RU / EN / TH)
     4.  Утилиты (форматирование, анимация чисел)
     5.  Переключение языка
     6.  Калькулятор прибыли + план зала
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

   Что вставить сюда: URL веб-приложения, который выдаёт Apps Script
   после «Развернуть → Новое развёртывание → Веб-приложение».
   Он выглядит так: https://script.google.com/macros/s/AKfycb.../exec
   Пошаговая настройка — в файле Code.gs и в README.

   Резервный путь (если Apps Script не используется): заполните
   BOT_TOKEN и CHAT_ID, тогда сайт обратится к Bot API напрямую.
   Учтите, что на статическом хостинге токен виден всем посетителям.
   ================================================================= */
const APPS_SCRIPT_URL = "PASTE_YOUR_WEB_APP_URL_HERE";

const BOT_TOKEN = "";   // запасной вариант, обычно оставляем пустым
const CHAT_ID   = "";   // запасной вариант, обычно оставляем пустым

/* =================================================================
   2. БИЗНЕС-КОНСТАНТЫ
   ================================================================= */
/* Прирост выручки по тарифам. Значения из ТЗ: Standard +10%, Premium +15%.
   В брошюре «Цифровой официант» заявлен консервативный ориентир «+6% и более»
   к среднему чеку — если хотите обещать меньше, а отдавать больше,
   поставьте { std: 0.06, prm: 0.10 }: изменится вся страница разом. */
const UPLIFT = { std: 0.10, prm: 0.15 };

const PRICE = {                                     // USD за устройство в месяц
  low:  { std: 10, prm: 20 },
  high: { std: 30, prm: 60 }
};
const USD_THB = 36;                                 // курс для расчёта окупаемости

/* =================================================================
   3. СЛОВАРИ ПЕРЕВОДОВ
   Все тексты страницы лежат здесь: чтобы добавить язык, скопируйте
   любой блок, переведите значения и добавьте кнопку в шапке.
   ================================================================= */
const I18N = {

  ru: {
    "meta.title": "JET MEDIA — цифровой официант для ресторанов. Дополнительная выручка без найма персонала",
    "meta.desc": "JET MEDIA бесплатно устанавливает планшеты-официанты на столы ресторана: AI-апселл, мультиязычное меню, оплата, отзывы и аналитика. Первый месяц бесплатно.",

    "nav.calc": "Калькулятор", "nav.why": "Как растёт чек", "nav.ops": "Возможности",
    "nav.pricing": "Тарифы", "nav.faq": "Вопросы", "nav.cta": "Демонстрация",

    "hero.eyebrow": "Пхукет · Цифровой официант на каждом столе",
    "hero.title1": "Дополнительная выручка", "hero.title2": "без найма персонала",
    "hero.sub": "Мы бесплатно устанавливаем планшеты в ресторан. Первый месяц бесплатно. Со второго месяца оплачивается только аренда оборудования и обслуживание. Отказаться можно в любой момент.",
    "hero.ctaDemo": "Заказать демонстрацию", "hero.ctaInstall": "Заказать установку",
    "hero.t1": "к выручке зала", "hero.t2": "нагрузки на персонал", "hero.t3": "дня на запуск",

    "calc.title": "Калькулятор прибыли", "calc.badge": "THB / месяц",
    "calc.tables": "Количество столиков", "calc.guests": "Посетителей в месяц", "calc.check": "Средний чек",
    "calc.current": "Текущая выручка", "calc.standard": "Standard", "calc.premium": "Premium",
    "calc.note": "Расчёт по среднему приросту чека при работе AI-рекомендаций. Итог зависит от меню и сезона.",

    "floor.eyebrow": "Ваш зал", "floor.title": "Каждый столик начинает продавать сам",
    "floor.s1": "Дополнительная прибыль в месяц", "floor.s2": "На один столик", "floor.s3": "Окупаемость аренды",
    "floor.note": "Окупаемость считается по тарифу высокого сезона — это самый строгий сценарий.",

    "why.eyebrow": "Механика роста",
    "why.title": "Почему выручка растёт без дополнительных гостей",
    "why.sub": "Цифровой официант работает как лучший сотрудник смены: знает меню наизусть, помнит маржинальность каждой позиции и никогда не забывает предложить десерт.",
    "why.c1t": "AI рекомендует маржинальное",
    "why.c1d": "Система подбирает блюда с высокой наценкой под конкретный заказ, а не показывает случайный список.",
    "why.c2t": "Десерт в нужный момент",
    "why.c2d": "Предложение появляется тогда, когда гость закончил основное блюдо, — момент, который персонал чаще всего пропускает.",
    "why.c3t": "Напитки и повторный заказ",
    "why.c3d": "Пустой бокал — упущенная выручка. Планшет предлагает повторить, пока гость за столом.",
    "why.c4t": "Акции и Happy Hour на виду",
    "why.c4d": "Сет дня, бизнес-ланч, сезонное меню и рекомендации шеф-повара видит каждый гость. Изменения появляются мгновенно на всех устройствах.",
    "why.c5t": "Официант и счёт в одно касание",
    "why.c5d": "Гость не ждёт зрительного контакта: вызвать официанта, запросить счёт и оплатить можно со стола. Оборачиваемость растёт.",
    "why.c6t": "Мультиязычное меню",
    "why.c6d": "Русский, английский, тайский и другие языки. Турист заказывает больше, когда понимает состав блюда.",
    "why.c7t": "Международные способы оплаты",
    "why.c7d": "Карты, локальные кошельки и QR. Оплата занимает секунды и не зависит от очереди на кассе.",
    "why.c8t": "Отзывы там, где они нужны",
    "why.c8d": "После визита гость получает предложение оставить отзыв в Google Maps, TripAdvisor или Facebook. Выше рейтинг — больше новых гостей.",
    "why.c9t": "Гости возвращаются",
    "why.c9d": "Программа лояльности, приглашения на события и персональные предложения увеличивают повторные визиты и загрузку зала.",

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

    "plat.eyebrow": "Платформа",
    "plat.title": "Мы строим не парк планшетов, а сеть точек контакта с гостем",
    "plat.sub": "Каждое устройство одновременно закрывает четыре задачи — и каждая масштабируется на новый ресторан, город и страну без изменения архитектуры.",
    "plat.c1t": "Операционный слой ресторана",
    "plat.c1d": "Меню, заказ, вызов персонала, оплата и отчётность в одном устройстве. Обновления приходят по воздуху на всю сеть сразу.",
    "plat.c2t": "Премиальный рекламный инвентарь",
    "plat.c2d": "Экран на столе, гость смотрит на него добровольно и 40+ минут. Показ привязан к месту, времени и составу заказа.",
    "plat.c3t": "Модель спроса",
    "plat.c3d": "Чем больше залов подключено, тем точнее рекомендации: система учится на реальных заказах, а не на гипотезах маркетолога.",
    "plat.c4t": "Франшиза и партнёры",
    "plat.c4d": "Развёртывание в новом регионе — это локальный партнёр, оборудование и наш стек. Открыты к разговору о партнёрстве и инвестициях.",

    "price.eyebrow": "Тарифы", "price.title": "Два тарифа. Оборудование остаётся нашим",
    "price.sub": "Цена указана за одно устройство в месяц. Первый месяц — бесплатно, без условий.",
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

    "how.eyebrow": "Запуск", "how.title": "От заявки до работающего зала — 1–3 дня",
    "how.s1t": "Заявка", "how.s1d": "Вы оставляете контакт, мы уточняем формат зала и меню.",
    "how.s2t": "Мы приезжаем", "how.s2d": "Смотрим зал, сеть и посадку, считаем количество устройств.",
    "how.s3t": "Устанавливаем оборудование", "how.s3d": "Крепления, зарядка, точки доступа. Работа зала не останавливается.",
    "how.s4t": "Настраиваем систему", "how.s4d": "Загружаем меню, цены, языки и акции, связываем систему с вашей кассой.",
    "how.s5t": "Обучаем персонал", "how.s5d": "Одна короткая смена — и официанты работают с системой уверенно.",
    "how.s6t": "Ресторан работает", "how.s6d": "Через 1–3 дня зал полностью запущен, вы видите первые данные по продажам.",

    "faq.eyebrow": "Вопросы", "faq.title": "Что важно знать до установки",
    "faq.q1": "Нужно ли покупать оборудование?",
    "faq.a1": "Нет. Оборудование предоставляется в аренду и остаётся собственностью JET MEDIA.",
    "faq.q2": "Когда начинается оплата?",
    "faq.a2": "Со второго месяца. Первый месяц бесплатный — вы принимаете решение по фактическим цифрам продаж.",
    "faq.q3": "Кто обслуживает оборудование?",
    "faq.a3": "Полностью JET MEDIA: настройка, обновления, диагностика и ремонт.",
    "faq.q4": "Что делать, если устройство сломалось?",
    "faq.a4": "При гарантийном случае меняем бесплатно. Если повреждение произошло по вине клиента, ремонт оплачивается отдельно.",
    "faq.q5": "Нужно ли менять кассовую систему?",
    "faq.a5": "Нет. Мы интегрируемся с вашей системой управления: заказы уходят на кухню, меню, цены и стоп-листы синхронизируются автоматически.",
    "faq.q6": "Можно ли отказаться?",
    "faq.a6": "Да, в любой момент. В конце оплаченного периода мы просто забираем оборудование.",
    "faq.q7": "Сколько занимает установка?",
    "faq.a7": "Обычно от одного до трёх дней, включая настройку меню и обучение персонала.",

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
    "form.errNet": "Не удалось отправить. Напишите нам в Telegram: @Nickbv",

    "foot.tag": "Цифровой официант, реклама и аналитика для ресторанов. Пхукет, Таиланд.",
    "foot.platform": "Платформа"
  },

  en: {
    "meta.title": "JET MEDIA — a digital waiter for restaurants. More revenue without hiring",
    "meta.desc": "JET MEDIA installs digital-waiter tablets on your restaurant tables for free: AI upsell, multilingual menu, payments, reviews and analytics. First month free.",

    "nav.calc": "Calculator", "nav.why": "How it works", "nav.ops": "Features",
    "nav.pricing": "Pricing", "nav.faq": "FAQ", "nav.cta": "Book a demo",

    "hero.eyebrow": "Phuket · A digital waiter on every table",
    "hero.title1": "More revenue", "hero.title2": "without hiring more staff",
    "hero.sub": "We install the tablets in your restaurant for free. The first month costs nothing. From the second month you pay only equipment rental and service. You can cancel at any time.",
    "hero.ctaDemo": "Book a demo", "hero.ctaInstall": "Request installation",
    "hero.t1": "added revenue", "hero.t2": "load on staff", "hero.t3": "days to launch",

    "calc.title": "Profit calculator", "calc.badge": "THB / month",
    "calc.tables": "Number of tables", "calc.guests": "Guests per month", "calc.check": "Average check",
    "calc.current": "Current revenue", "calc.standard": "Standard", "calc.premium": "Premium",
    "calc.note": "Based on the average check uplift AI recommendations deliver. Actual results depend on your menu and season.",

    "floor.eyebrow": "Your floor", "floor.title": "Every table starts selling on its own",
    "floor.s1": "Extra profit per month", "floor.s2": "Per table", "floor.s3": "Rental payback",
    "floor.note": "Payback is calculated at high-season pricing — the most conservative scenario.",

    "why.eyebrow": "The mechanics",
    "why.title": "Why revenue grows without a single extra guest",
    "why.sub": "The digital waiter works like your best team member: it knows the menu by heart, remembers the margin on every item and never forgets to offer dessert.",
    "why.c1t": "AI recommends high-margin dishes",
    "why.c1d": "The system matches high-margin items to the actual order instead of showing a random list.",
    "why.c2t": "Dessert at the right moment",
    "why.c2d": "The offer appears right after the main course — the moment staff miss most often.",
    "why.c3t": "Drinks and refills",
    "why.c3d": "An empty glass is lost revenue. The tablet offers a refill while the guest is still at the table.",
    "why.c4t": "Promotions and Happy Hour in plain sight",
    "why.c4d": "Set of the day, business lunch, seasonal menu and chef's picks reach every guest. Changes appear instantly on every device.",
    "why.c5t": "Server and bill in one tap",
    "why.c5d": "No waiting for eye contact: guests can call a server, request the bill and pay from the table. Tables turn faster.",
    "why.c6t": "Multilingual menu",
    "why.c6d": "Russian, English, Thai and more. Tourists order more when they understand what's in the dish.",
    "why.c7t": "International payment methods",
    "why.c7d": "Cards, local wallets and QR. Paying takes seconds and never depends on the queue at the till.",
    "why.c8t": "Reviews where they matter",
    "why.c8d": "After the visit, guests are invited to leave a review on Google Maps, TripAdvisor or Facebook. A higher rating brings new guests.",
    "why.c9t": "Guests come back",
    "why.c9d": "Loyalty programme, event invitations and personal offers increase repeat visits and keep the room full.",

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

    "plat.eyebrow": "Platform",
    "plat.title": "We're building a network of guest touchpoints, not a fleet of tablets",
    "plat.sub": "Each device covers four jobs at once — and each of them scales to a new restaurant, city and country without changing the architecture.",
    "plat.c1t": "The restaurant's operating layer",
    "plat.c1d": "Menu, ordering, service calls, payment and reporting in one device. Updates roll out over the air to the entire network.",
    "plat.c2t": "Premium ad inventory",
    "plat.c2d": "A screen on the table that guests look at willingly for 40+ minutes. Every impression is tied to place, time and order context.",
    "plat.c3t": "A demand model",
    "plat.c3d": "The more venues connected, the sharper the recommendations: the system learns from real orders, not marketing hypotheses.",
    "plat.c4t": "Franchise and partners",
    "plat.c4d": "Entering a new region takes a local partner, hardware and our stack. We're open to partnership and investment conversations.",

    "price.eyebrow": "Pricing", "price.title": "Two plans. The hardware stays ours",
    "price.sub": "Price is per device per month. The first month is free, no conditions.",
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

    "how.eyebrow": "Launch", "how.title": "From request to a working floor in 1–3 days",
    "how.s1t": "Request", "how.s1d": "You leave a contact, we clarify the venue format and the menu.",
    "how.s2t": "We visit", "how.s2d": "We check the room, the network and the seating, then count the devices.",
    "how.s3t": "We install the hardware", "how.s3d": "Mounts, charging, access points. Service never stops.",
    "how.s4t": "We configure the system", "how.s4d": "Menu, prices, languages and promotions, connected to your POS.",
    "how.s5t": "We train the staff", "how.s5d": "One short shift and your servers work with the system confidently.",
    "how.s6t": "The restaurant runs", "how.s6d": "Within 1–3 days the floor is fully live and you see the first sales data.",

    "faq.eyebrow": "FAQ", "faq.title": "What to know before installation",
    "faq.q1": "Do I have to buy the equipment?",
    "faq.a1": "No. The equipment is rented and remains the property of JET MEDIA.",
    "faq.q2": "When does billing start?",
    "faq.a2": "From the second month. The first month is free — you decide based on real sales numbers.",
    "faq.q3": "Who services the equipment?",
    "faq.a3": "JET MEDIA does, fully: setup, updates, diagnostics and repair.",
    "faq.q4": "What if a device breaks?",
    "faq.a4": "Warranty cases are replaced free of charge. Damage caused by the client is repaired at extra cost.",
    "faq.q5": "Do I need to change my POS system?",
    "faq.a5": "No. We integrate with your management system: orders go to the kitchen, menu, prices and stop-lists sync automatically.",
    "faq.q6": "Can I cancel?",
    "faq.a6": "Yes, at any time. At the end of the paid period we simply collect the equipment.",
    "faq.q7": "How long does installation take?",
    "faq.a7": "Usually one to three days, including menu setup and staff training.",

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
    "form.errNet": "Sending failed. Message us on Telegram: @Nickbv",

    "foot.tag": "Digital waiter, advertising and analytics for restaurants. Phuket, Thailand.",
    "foot.platform": "Platform"
  },

  th: {
    "meta.title": "JET MEDIA — พนักงานเสิร์ฟดิจิทัลสำหรับร้านอาหาร เพิ่มรายได้โดยไม่ต้องจ้างพนักงานเพิ่ม",
    "meta.desc": "JET MEDIA ติดตั้งแท็บเล็ตพนักงานเสิร์ฟดิจิทัลบนโต๊ะร้านอาหารให้ฟรี ทั้งการแนะนำเมนูด้วย AI เมนูหลายภาษา การชำระเงิน รีวิว และการวิเคราะห์ยอดขาย เดือนแรกฟรี",

    "nav.calc": "คำนวณกำไร", "nav.why": "เพิ่มยอดอย่างไร", "nav.ops": "ความสามารถ",
    "nav.pricing": "แพ็กเกจ", "nav.faq": "คำถามที่พบบ่อย", "nav.cta": "ขอชมการสาธิต",

    "hero.eyebrow": "ภูเก็ต · พนักงานเสิร์ฟดิจิทัลบนทุกโต๊ะ",
    "hero.title1": "รายได้เพิ่มขึ้น", "hero.title2": "โดยไม่ต้องจ้างพนักงานเพิ่ม",
    "hero.sub": "เราติดตั้งแท็บเล็ตให้ร้านของคุณฟรี เดือนแรกไม่มีค่าใช้จ่าย ตั้งแต่เดือนที่สองจ่ายเพียงค่าเช่าอุปกรณ์และค่าบริการ ยกเลิกได้ทุกเมื่อ",
    "hero.ctaDemo": "ขอชมการสาธิต", "hero.ctaInstall": "ขอติดตั้ง",
    "hero.t1": "รายได้ที่เพิ่มขึ้น", "hero.t2": "ภาระงานของพนักงาน", "hero.t3": "วันในการเริ่มใช้งาน",

    "calc.title": "เครื่องคำนวณกำไร", "calc.badge": "บาท / เดือน",
    "calc.tables": "จำนวนโต๊ะ", "calc.guests": "ลูกค้าต่อเดือน", "calc.check": "ยอดบิลเฉลี่ย",
    "calc.current": "รายได้ปัจจุบัน", "calc.standard": "Standard", "calc.premium": "Premium",
    "calc.note": "คำนวณจากยอดบิลที่เพิ่มขึ้นโดยเฉลี่ยเมื่อใช้คำแนะนำจาก AI ผลลัพธ์จริงขึ้นอยู่กับเมนูและฤดูกาล",

    "floor.eyebrow": "ห้องอาหารของคุณ", "floor.title": "ทุกโต๊ะเริ่มขายด้วยตัวเอง",
    "floor.s1": "กำไรเพิ่มต่อเดือน", "floor.s2": "ต่อหนึ่งโต๊ะ", "floor.s3": "คุ้มค่าเช่ากี่เท่า",
    "floor.note": "คำนวณความคุ้มค่าด้วยราคาช่วงไฮซีซัน ซึ่งเป็นกรณีที่เข้มงวดที่สุด",

    "why.eyebrow": "กลไกการเติบโต",
    "why.title": "ทำไมรายได้เพิ่มขึ้นโดยไม่ต้องมีลูกค้าเพิ่ม",
    "why.sub": "พนักงานเสิร์ฟดิจิทัลทำงานเหมือนพนักงานที่เก่งที่สุด จำเมนูได้ทุกจาน รู้กำไรของแต่ละเมนู และไม่เคยลืมเสนอของหวาน",
    "why.c1t": "AI แนะนำเมนูกำไรสูง",
    "why.c1d": "ระบบเลือกเมนูกำไรสูงให้เข้ากับออร์เดอร์จริง ไม่ใช่แสดงรายการแบบสุ่ม",
    "why.c2t": "เสนอของหวานถูกจังหวะ",
    "why.c2d": "ข้อเสนอปรากฏหลังจานหลักพอดี ซึ่งเป็นจังหวะที่พนักงานมักพลาด",
    "why.c3t": "เครื่องดื่มและการสั่งซ้ำ",
    "why.c3d": "แก้วที่ว่างคือรายได้ที่หายไป แท็บเล็ตเสนอสั่งเพิ่มขณะลูกค้ายังนั่งอยู่",
    "why.c4t": "โปรโมชันและ Happy Hour เห็นชัด",
    "why.c4d": "เซ็ตประจำวัน บิสสิเนสลันช์ เมนูตามฤดูกาล และเมนูแนะนำของเชฟ ไปถึงลูกค้าทุกคน ทุกการเปลี่ยนแปลงแสดงผลทันทีบนทุกเครื่อง",
    "why.c5t": "เรียกพนักงานและขอบิลด้วยปุ่มเดียว",
    "why.c5d": "ลูกค้าไม่ต้องรอสบตา เรียกพนักงาน ขอบิล และชำระเงินได้จากโต๊ะ โต๊ะจึงหมุนเวียนเร็วขึ้น",
    "why.c6t": "เมนูหลายภาษา",
    "why.c6d": "ไทย อังกฤษ รัสเซีย และภาษาอื่น ๆ นักท่องเที่ยวสั่งมากขึ้นเมื่อเข้าใจส่วนประกอบของอาหาร",
    "why.c7t": "ช่องทางชำระเงินระหว่างประเทศ",
    "why.c7d": "บัตร วอลเล็ตท้องถิ่น และ QR จ่ายเสร็จในไม่กี่วินาที ไม่ต้องรอคิวที่แคชเชียร์",
    "why.c8t": "รีวิวในที่ที่สำคัญ",
    "why.c8d": "หลังใช้บริการ ระบบเชิญลูกค้าเขียนรีวิวบน Google Maps, TripAdvisor หรือ Facebook คะแนนสูงขึ้นย่อมดึงลูกค้าใหม่",
    "why.c9t": "ลูกค้ากลับมาอีก",
    "why.c9d": "โปรแกรมสะสมคะแนน คำเชิญร่วมงาน และข้อเสนอเฉพาะบุคคล ช่วยเพิ่มการกลับมาใช้บริการซ้ำ",

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

    "plat.eyebrow": "แพลตฟอร์ม",
    "plat.title": "เราสร้างเครือข่ายจุดสัมผัสลูกค้า ไม่ใช่แค่กองแท็บเล็ต",
    "plat.sub": "อุปกรณ์แต่ละเครื่องทำงานสี่ด้านพร้อมกัน และทุกด้านขยายไปยังร้าน เมือง และประเทศใหม่ได้โดยไม่ต้องเปลี่ยนสถาปัตยกรรม",
    "plat.c1t": "ชั้นปฏิบัติการของร้าน",
    "plat.c1d": "เมนู การสั่ง เรียกพนักงาน ชำระเงิน และรายงาน รวมในเครื่องเดียว อัปเดตส่งถึงทั้งเครือข่ายพร้อมกัน",
    "plat.c2t": "พื้นที่โฆษณาระดับพรีเมียม",
    "plat.c2d": "จอบนโต๊ะที่ลูกค้าเลือกมองเองนานกว่า 40 นาที ทุกการแสดงผลผูกกับสถานที่ เวลา และออร์เดอร์",
    "plat.c3t": "โมเดลความต้องการ",
    "plat.c3d": "ยิ่งเชื่อมต่อหลายร้าน คำแนะนำยิ่งแม่นยำ เพราะระบบเรียนรู้จากออร์เดอร์จริง ไม่ใช่สมมติฐานทางการตลาด",
    "plat.c4t": "แฟรนไชส์และพันธมิตร",
    "plat.c4d": "การเข้าสู่ภูมิภาคใหม่ใช้พันธมิตรท้องถิ่น อุปกรณ์ และเทคโนโลยีของเรา เรายินดีคุยเรื่องความร่วมมือและการลงทุน",

    "price.eyebrow": "แพ็กเกจ", "price.title": "สองแพ็กเกจ อุปกรณ์ยังเป็นของเรา",
    "price.sub": "ราคาต่อหนึ่งเครื่องต่อเดือน เดือนแรกฟรี ไม่มีเงื่อนไข",
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

    "how.eyebrow": "เริ่มใช้งาน", "how.title": "จากคำขอถึงห้องอาหารพร้อมใช้งานใน 1–3 วัน",
    "how.s1t": "ส่งคำขอ", "how.s1d": "คุณฝากช่องทางติดต่อ เราสอบถามรูปแบบร้านและเมนู",
    "how.s2t": "เราเข้าไปดูหน้างาน", "how.s2d": "ตรวจห้องอาหาร ระบบเครือข่าย และที่นั่ง เพื่อคำนวณจำนวนเครื่อง",
    "how.s3t": "ติดตั้งอุปกรณ์", "how.s3d": "ขายึด จุดชาร์จ และแอ็กเซสพอยต์ ร้านเปิดบริการได้ตามปกติ",
    "how.s4t": "ตั้งค่าระบบ", "how.s4d": "ใส่เมนู ราคา ภาษา และโปรโมชัน พร้อมเชื่อมต่อกับระบบขายของคุณ",
    "how.s5t": "อบรมพนักงาน", "how.s5d": "ใช้เวลาเพียงหนึ่งกะสั้น ๆ พนักงานก็ใช้ระบบได้อย่างมั่นใจ",
    "how.s6t": "ร้านเดินเต็มระบบ", "how.s6d": "ภายใน 1–3 วัน ห้องอาหารพร้อมใช้งานเต็มรูปแบบ และคุณเห็นข้อมูลยอดขายชุดแรก",

    "faq.eyebrow": "คำถามที่พบบ่อย", "faq.title": "สิ่งที่ควรรู้ก่อนติดตั้ง",
    "faq.q1": "ต้องซื้ออุปกรณ์เองหรือไม่",
    "faq.a1": "ไม่ต้อง อุปกรณ์ให้เช่าและยังเป็นทรัพย์สินของ JET MEDIA",
    "faq.q2": "เริ่มเก็บค่าบริการเมื่อไร",
    "faq.a2": "ตั้งแต่เดือนที่สอง เดือนแรกฟรี คุณจึงตัดสินใจจากตัวเลขยอดขายจริง",
    "faq.q3": "ใครดูแลอุปกรณ์",
    "faq.a3": "JET MEDIA ดูแลทั้งหมด ทั้งการตั้งค่า อัปเดต ตรวจเช็ก และซ่อม",
    "faq.q4": "ถ้าอุปกรณ์เสียต้องทำอย่างไร",
    "faq.a4": "หากอยู่ในการรับประกัน เราเปลี่ยนให้ฟรี หากเสียหายจากการใช้งานของลูกค้า คิดค่าซ่อมแยกต่างหาก",
    "faq.q5": "ต้องเปลี่ยนระบบ POS หรือไม่",
    "faq.a5": "ไม่ต้อง เราเชื่อมต่อกับระบบจัดการเดิมของคุณ ออร์เดอร์ส่งเข้าครัว เมนู ราคา และสต็อปลิสต์ซิงก์อัตโนมัติ",
    "faq.q6": "ยกเลิกได้หรือไม่",
    "faq.a6": "ได้ทุกเมื่อ เมื่อสิ้นสุดรอบที่ชำระแล้ว เราเข้าไปรับอุปกรณ์คืน",
    "faq.q7": "ติดตั้งใช้เวลานานเท่าไร",
    "faq.a7": "โดยทั่วไป 1–3 วัน รวมการตั้งค่าเมนูและอบรมพนักงาน",

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
    "form.errNet": "ส่งไม่สำเร็จ ทักหาเราทาง Telegram: @Nickbv",

    "foot.tag": "พนักงานเสิร์ฟดิจิทัล โฆษณา และการวิเคราะห์สำหรับร้านอาหาร ภูเก็ต ประเทศไทย",
    "foot.platform": "แพลตฟอร์ม"
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
const money  = n => nf.format(Math.round(n)) + " ฿";
const plus   = n => "+" + money(n);
const plainN = n => nf.format(Math.round(n));

/* Плавный счётчик: анимирует число от текущего к целевому.
   fmt — функция форматирования, чтобы одна анимация обслуживала
   и «1 530 000 ฿», и «×7». */
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
  $$(".lang-btn").forEach(b => b.classList.toggle("is-active", b.dataset.setLang === lang));
  recalc(true);
  renderPrices(true);

  try { localStorage.setItem("jm_lang", lang); } catch (e) { /* приватный режим — не страшно */ }
}

$$(".lang-btn").forEach(btn => btn.addEventListener("click", () => applyLang(btn.dataset.setLang)));

/* =================================================================
   6. КАЛЬКУЛЯТОР ПРИБЫЛИ + ПЛАН ЗАЛА
   ================================================================= */
const sTables = $("#sTables"), sGuests = $("#sGuests"), sCheck = $("#sCheck");
const oTables = $("#oTables"), oGuests = $("#oGuests"), oCheck = $("#oCheck");
const rNow = $("#rNow"), rStd = $("#rStd"), rPrm = $("#rPrm");
const fMonth = $("#fMonth"), fTable = $("#fTable"), fRoi = $("#fRoi");
const floorMap = $("#floorMap");

let floorPlan = "std";        // какой тариф показывает план зала
let lastTables = 0;           // чтобы не перерисовывать сетку зря

/* Заливка дорожки ползунка через CSS-переменную */
function paintRange(input){
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty("--p", pct + "%");
}

/* Перерисовка сетки столиков */
function renderFloor(count){
  if (count === lastTables) return;
  lastTables = count;
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= count; i++){
    const cell = document.createElement("div");
    cell.className = "tbl";
    cell.textContent = String(i).padStart(2, "0");
    if (!reduceMotion) cell.style.animationDelay = Math.min(i * 12, 420) + "ms";
    frag.appendChild(cell);
  }
  floorMap.replaceChildren(frag);
}

/* Главный пересчёт. instant = true — без анимации (например, при смене языка) */
function recalc(instant){
  const tables = +sTables.value;
  const guests = +sGuests.value;
  const check  = +sCheck.value;

  const revenue = guests * check;
  const addStd  = revenue * UPLIFT.std;
  const addPrm  = revenue * UPLIFT.prm;

  const add    = floorPlan === "prm" ? addPrm : addStd;
  const perTbl = add / tables;
  // Окупаемость: прирост против аренды по цене высокого сезона
  const rent = tables * PRICE.high[floorPlan] * USD_THB;
  const roi  = rent > 0 ? add / rent : 0;

  oTables.textContent = plainN(tables);
  oGuests.textContent = plainN(guests);
  oCheck.textContent  = money(check);
  [sTables, sGuests, sCheck].forEach(paintRange);

  const dur = instant ? 0 : 650;
  animateNumber(rNow, revenue, money, dur);
  animateNumber(rStd, addStd, plus, dur);
  animateNumber(rPrm, addPrm, plus, dur);
  animateNumber(fMonth, add, plus, dur);
  animateNumber(fTable, perTbl, plus, dur);
  animateNumber(fRoi, roi, v => "×" + v.toFixed(1), dur);

  renderFloor(tables);
}

[sTables, sGuests, sCheck].forEach(inp => inp.addEventListener("input", () => recalc(false)));

/* Переключатель Standard / Premium под планом зала */
$$("[data-plan]").forEach(btn => {
  btn.addEventListener("click", () => {
    floorPlan = btn.dataset.plan;
    $$("[data-plan]").forEach(b => b.classList.toggle("is-active", b === btn));
    recalc(false);
  });
});

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
