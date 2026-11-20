export type Locale = "en" | "ar";
export const isLocale = (value: string): value is Locale => value === "en" || value === "ar";

export type FacilityGroup = { title: string; items: string[] };
export type HotelContent = {
  hotelName: string; metaDescription: string; address: string;
  nav: { overview:string; facilities:string; location:string; rooms:string; gallery:string; reviews:string; contact:string; };
  labels: {
    menu:string; close:string; map:string; bookingTitle:string; checkin:string; checkout:string;
    availability:string; galleryView:string; viewAll:string; overviewTitle:string; facilitiesTitle:string;
    important:string; checkinPolicy:string; checkoutPolicy:string; locationTitle:string; nearby:string;
    roomsTitle:string; noDates:string; noBooking:string; dateError:string; reviewsTitle:string; name:string;
    email:string; visit:string; rating:string; pros:string; cons:string; submitReview:string;
    contactTitle:string; subject:string; message:string; send:string; noBackend:string;
    currency:string; previous:string; next:string; image:string; footerNote:string;
  };
  overview: string[];
  quick: string[];
  facilities: FacilityGroup[];
  attractions: {name:string; distance:string}[];
};

const en: HotelContent = {
  hotelName: "Hotel Opal Legacy Luxor",
  metaDescription: "Discover Hotel Opal Legacy Luxor, its rooms, amenities, gallery, and location near Luxor attractions.",
  address: "Rd Lead To Esna, Luxor, Egypt",
  nav: { overview:"Overview",facilities:"Facilities",location:"Location",rooms:"Rooms & Availability",
    gallery:"Gallery",reviews:"Write a review",contact:"Contact Us" },
  labels: {
    menu:"Menu",close:"Close",map:"Map",bookingTitle:"Online Reservation",checkin:"Check-in date",
    checkout:"Check-out date",availability:"Check availability",galleryView:"View photo",
    viewAll:"View all photos",overviewTitle:"Opal Legacy Luxor Hotel",
    facilitiesTitle:"Facilities",important:"Important information",checkinPolicy:"Check-in: from 08:00 until 12:00",
    checkoutPolicy:"Check-out: until 10:00",locationTitle:"Location",nearby:"Local attractions",
    roomsTitle:"Rooms & Availability",noDates:"Please, select dates to see available rooms.",
    noBooking:"Live availability is not connected yet. Your dates were not submitted.",
    dateError:"Choose a check-out date later than your check-in date.",
    reviewsTitle:"Write a review",name:"Name",email:"Email",visit:"Travel date",rating:"Rating (1–10)",
    pros:"Pros",cons:"Cons",submitReview:"Submit review",contactTitle:"Contact Us",subject:"Subject",
    message:"Message",send:"Send message",noBackend:"This form is not connected yet. Nothing was sent.",
    currency:"Currency",previous:"Previous photo",next:"Next photo",image:"Hotel photo",
    footerNote:"Opal Legacy Hotel · Website preview — live booking and inquiries are not enabled."
  },
  overview: [
    "Opal Legacy Luxor Hotel offers air-conditioned accommodation and a restaurant in Luxor. The property features traditional architectural details and gardens.",
    "Rooms feature satellite flat-screen televisions, tea and coffee-making facilities, and selected views of the garden.",
    "Guests can enjoy outdoor seating and leisure activities. Horse riding and cycling are listed among the activities offered."
  ],
  quick: ["Wi-Fi","24-hour reception","Express check-in/-out","Horseback riding","Airport shuttle","Restaurant","Child-friendly","Wheelchair access"],
  facilities: [
    {title:"General",items:["No smoking on site","Wi-Fi","Parking","Safe deposit box","24-hour reception","VIP check-in/-out","Express check-in/-out","Pets allowed","Rooms/Facilities for disabled","Wheelchair access","24-hour security","Luggage storage","Allergy-free rooms","Currency exchange","Coffee shop","Fireplace","Smoke detectors","Toilet for disabled","Fire extinguishers"]},
    {title:"Dining",items:["Electric kettle","In-room breakfast","Restaurant","Snack bar","Bar/Lounge area","Outdoor dining area","Picnic area/Tables","Dinner","Packed lunches","Special diet menus"]},
    {title:"Leisure & Sports",items:["Sun loungers","Live entertainment","Night club","Sun terrace","Garden area","BBQ facilities","Leisure/TV room","Horseback riding","Cycling","Fishing","Public Bath"]},
    {title:"Services",items:["Airport shuttle","Room service","Housekeeping","Car hire","Laundry","Dry cleaning","Tours/Ticket assistance","Grocery shopping service","Meeting/Banquet facilities","Fax/Photocopying","Happy hour"]},
    {title:"Room Amenities",items:["Air conditioning","Heating","Mini-bar","Soundproofed rooms","Sitting area","Patio","Terrace","Garden furniture","Tea and coffee facilities","Dining table","Ironing facilities","Free toiletries","Flat-screen TV","AM/FM alarm clock","Cots","Babysitting/Child services","Baby pushchair","Children's buffet","Children's play area"]}
  ],
  attractions: [
    {name:"Nady Land Amusement Park & Zoo",distance:"1.4 km"},
    {name:"Salem Hot Air Balloons Luxor",distance:"1.5 km"},
    {name:"Banana Island",distance:"2.6 km"},
    {name:"Luxor Train Station",distance:"4.5 km"},
    {name:"Luxor Temple",distance:"4.6 km"},
    {name:"Luxor International Airport",distance:"14 km"}
  ]
};
const ar: HotelContent = {
  hotelName:"فندق Opal Legacy Luxor",
  metaDescription:"تعرف على فندق أوبال ليجاسي بالأقصر والمرافق والموقع والصور.",
  address:"Rd Lead To Esna، الأقصر، مصر",
  nav:{overview:"نظرة عامة",facilities:"مرافق الفندق",location:"الموقع",rooms:"الغرف والإتاحة",
    gallery:"معرض الصور",reviews:"اكتب تعليق",contact:"اتصل بنا"},
  labels:{
    menu:"القائمة",close:"إغلاق",map:"خريطة",bookingTitle:"الحجز عبر الإنترنت",checkin:"تاريخ الوصول",
    checkout:"تاريخ المغادرة",availability:"تحقق من الأماكن المتوفرة",galleryView:"عرض الصورة",
    viewAll:"عرض كل الصور",overviewTitle:"فندق Opal Legacy Luxor",facilitiesTitle:"مرافق الفندق",
    important:"المعلومات الهامة",checkinPolicy:"تسجيل الوصول: من 08:00 حتى 12:00",
    checkoutPolicy:"تسجيل المغادرة: حتى 10:00",locationTitle:"الموقع",nearby:"المعالم السياحية",
    roomsTitle:"الغرف والإتاحة",noDates:"من فضلك، أدخل تواريخ الإقامة للتحقق من الغرف المتوفرة.",
    noBooking:"الحجز المباشر لم يُربط بعد. لم يتم إرسال تواريخ الإقامة.",
    dateError:"تاريخ المغادرة لازم يكون بعد تاريخ الوصول.",
    reviewsTitle:"اكتب تعليق",name:"الاسم",email:"البريد الإلكتروني",visit:"تاريخ الزيارة",
    rating:"التقييم (من 1 إلى 10)",pros:"الإيجابيات",cons:"السلبيات",
    submitReview:"إرسال التقييم",contactTitle:"اتصل بنا",subject:"الموضوع",message:"الرسالة",
    send:"إرسال الرسالة",noBackend:"النموذج غير متصل حاليًا ولم يتم إرسال أي بيانات.",
    currency:"العملة",previous:"الصورة السابقة",next:"الصورة التالية",image:"صورة الفندق",
    footerNote:"فندق أوبال ليجاسي · نسخة تجريبية — الحجز والتواصل الإلكتروني غير متاحين بعد."
  },
  overview:[
    "يقع فندق Opal Legacy Luxor في الأقصر، ويوفر إقامة مكيفة ومرافق لاستقبال الضيوف ومطعمًا.",
    "تتميز الغرف بتفاصيل معمارية تقليدية، وتحتوي على تلفزيون ومرافق إعداد الشاي والقهوة، وتطل بعض الغرف على الحديقة.",
    "تشمل المرافق مناطق جلوس خارجية وأنشطة ترفيهية متنوعة مثل ركوب الخيل وركوب الدراجات."
  ],
  quick:["واي فاي","مكتب استقبال 24 ساعة","تسجيل سريع للوصول والمغادرة","ركوب الخيل",
    "خدمة نقل المطار","مطعم","مناسب للأطفال","مدخل كراسي متحركة"],
  facilities:[
    {title:"المعلومات العامة",items:["ممنوع التدخين في كل الأماكن","واي فاي","موقف السيارات","صندوق الإيداع الآمن","مكتب استقبال 24 ساعة","تسجيل الوصول/المغادرة الخاص","تسجيل سريع للوصول والمغادرة","مسموح بدخول الحيوانات الأليفة","غرف/مرافق لذوي الاحتياجات الخاصة","مدخل كراسي متحركة","خدمة الأمن 24 ساعة","خزن الأمتعة","غرف خالية من المواد المسببة للحساسية","تحويل العملات","مقهى","مدفأة","أجهزة إنذار للدخان","مرحاض لذوي الاحتياجات الخاصة","طفايات الحريق"]},
    {title:"الطعام",items:["غلاية الماء الكهربائية","إفطار في الغرفة","مطعم","بار الوجبات الخفيفة","حانة/ردهة","فناء خارجي للأكل","منطقة للتنزه/طاولات","عشاء","وجبات غداء جاهزة","قوائم النظام الغذائي الخاص"]},
    {title:"الأنشطة الرياضية والترفيهية",items:["كراسي للتشمس","فعاليات ترفيهية حية","ملهى ليلي","تراس للتشمس","حديقة","لوازم شواء باربيكيو","غرفة الاستراحة/التلفزيون","ركوب الخيل","ركوب الدراجات","صيد السمك","حمام عمومي"]},
    {title:"الخدمات",items:["خدمة نقل المطار","خدمة الغرف","خدمة تنظيف الغرف","تأجير السيارات","خدمة غسيل الملابس","تنظيف جاف","المساعدة في الجولات/التذاكر","خدمة التسوق","قاعات الاجتماعات/الولائم","فاكس/تصوير المستندات","ساعة السعادة"]},
    {title:"مرافق الغرفة",items:["تكييف","تدفئة","ميني بار","نوافذ عازلة للصوت","منطقة الجلوس","فناء","شرفة","مفروشات الحدائق","مرافق الشاي والقهوة","طاولة الطعام","مرافق الكي","مستلزمات الحمام المجانية","تلفاز بشاشة مسطحة","منبه AM/FM","أسرة أطفال","خدمة مجالسة الأطفال","عربة أطفال","بوفيه للأطفال","منطقة لعب الأطفال"]}
  ],
  attractions:[
    {name:"ملاهي وحديقة حيوان الندي لاند",distance:"1.4 كم"},
    {name:"سالم للمناطيد بالأقصر",distance:"1.5 كم"},
    {name:"جزيرة الموز",distance:"2.6 كم"},
    {name:"محطة قطار الأقصر",distance:"4.5 كم"},
    {name:"معبد الأقصر",distance:"4.6 كم"},
    {name:"مطار الأقصر الدولي",distance:"14 كم"}
  ]
};
const content:Record<Locale,HotelContent>={en,ar};
export const getContent=(locale:Locale): HotelContent=>content[locale];

// Content is provisional transcription of a third-party listing; verify
// services, policies, distances, room inventory and translations with hotel management.
