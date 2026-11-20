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
  /** House rules shown under "Important information". */
  policies: string[];
  /** In-room features used by the Rooms section. */
  roomFacts: { count: string; summary: string; features: string[] };
};

const en: HotelContent = {
  hotelName: "Hotel Opal Legacy Luxor",
  metaDescription: "Opal Legacy Luxor Hotel on Luxor's East Bank: 40 air-conditioned rooms with garden views, the Opal restaurant, outdoor bar, horseback riding, free parking and airport shuttle.",
  address: "Rd Lead To Esna, Luxor, Egypt",
  nav: { overview:"Overview",facilities:"Facilities",location:"Location",rooms:"Rooms",
    gallery:"Gallery",reviews:"Write a review",contact:"Contact Us" },
  labels: {
    menu:"Menu",close:"Close",map:"Map",bookingTitle:"Online Reservation",checkin:"Check-in date",
    checkout:"Check-out date",availability:"Check availability",galleryView:"View photo",
    viewAll:"View all photos",overviewTitle:"Opal Legacy Luxor Hotel",
    facilitiesTitle:"Facilities",important:"Important information",checkinPolicy:"Check-in: from 08:00 until 12:00",
    checkoutPolicy:"Check-out: until 10:00",locationTitle:"Location",nearby:"Local attractions",
    roomsTitle:"Rooms",noDates:"Please, select dates to see available rooms.",
    noBooking:"Choose your dates and we will take you to the reservation request.",
    dateError:"Choose a check-out date later than your check-in date.",
    reviewsTitle:"Write a review",name:"Name",email:"Email",visit:"Travel date",rating:"Rating (1–10)",
    pros:"Pros",cons:"Cons",submitReview:"Submit review",contactTitle:"Contact Us",subject:"Subject",
    message:"Message",send:"Send message",noBackend:"We couldn't send this right now. Please try again in a moment.",
    currency:"Currency",previous:"Previous photo",next:"Next photo",image:"Hotel photo",
    footerNote:"Opal Legacy Luxor Hotel · Rd Lead To Esna, Luxor, Egypt"
  },
  overview: [
    "Opal Legacy Luxor Hotel sits on the road to Esna on Luxor's East Bank, with air-conditioned rooms, garden views and an à la carte restaurant.",
    "Each of the hotel's 40 rooms has a flat-screen TV with satellite channels, a minibar and tea and coffee facilities. Bathrooms come with a shower and bidet, and some rooms add a hairdryer and bathrobes.",
    "The Opal restaurant serves international cuisine alongside an outdoor bar. Spend the day on the sun terrace or in the picnic area, the evening at the nightclub, or ask the team to arrange horseback-riding tours and cycling.",
    "Luxor Temple and the Temple of Karnak are on the same bank: Luxor Temple is about 4.7 km away and the Corniche 4.8 km. The Colossi of Memnon are around 15 minutes by car, and Sopranos Land amusement park and zoo is roughly a 20-minute walk."
  ],
  quick: ["Wi-Fi","Free parking","24-hour reception","Express check-in/-out","Airport shuttle","On-site dining","Meeting facilities","Child-friendly","Horseback riding"],
  facilities: [
    {title:"General",items:["No smoking on site","Wi-Fi","Free parking","Safe deposit box","24-hour reception","VIP check-in/-out","Express check-in/-out","Pets allowed","Rooms/Facilities for disabled","Wheelchair access","24-hour security","Luggage storage","Allergy-free rooms","Currency exchange","Coffee shop","Fireplace","Smoke detectors","Toilet for disabled","Fire extinguishers"]},
    {title:"Dining",items:["Electric kettle","In-room breakfast","Restaurant","Snack bar","Bar/Lounge area","Outdoor dining area","Picnic area/Tables","Dinner","Packed lunches","Special diet menus"]},
    {title:"Leisure & Sports",items:["Sun loungers","Live entertainment","Night club","Sun terrace","Garden area","BBQ facilities","Leisure/TV room","Horseback riding","Cycling","Fishing","Public Bath"]},
    {title:"Services",items:["Airport shuttle","Room service","Housekeeping","Car hire","Laundry","Dry cleaning","Tours/Ticket assistance","Grocery shopping service","Meeting/Banquet facilities","Fax/Photocopying","Happy hour"]},
    {title:"Room Amenities",items:["Air conditioning","Heating","Mini-bar","Soundproofed rooms","Sitting area","Patio","Terrace","Garden furniture","Tea and coffee facilities","Dining table","Ironing facilities","Free toiletries","Flat-screen TV","AM/FM alarm clock","Cots","Babysitting/Child services","Baby pushchair","Children's buffet","Children's play area"]}
  ],
  attractions: [
    {name:"Salem Hot Air Balloons Luxor",distance:"1.5 km"},
    {name:"Sopranos Land amusement park & zoo",distance:"1.7 km"},
    {name:"Banana Island",distance:"2.6 km"},
    {name:"Luxor Train Station",distance:"4.5 km"},
    {name:"Luxor Temple",distance:"4.7 km"},
    {name:"Luxor Corniche",distance:"4.8 km"},
    {name:"Luxor International Airport",distance:"14 km"},
    {name:"Colossi of Memnon",distance:"15 min by car"}
  ],
  policies: [
    "Check-in: from 08:00 until 12:00",
    "Check-out: until 10:00",
    "Pets are allowed",
    "No smoking anywhere on the property",
    "Hen, stag and similar parties are not accommodated"
  ],
  roomFacts: {
    count: "40 rooms",
    summary: "Air-conditioned rooms with garden views, a flat-screen satellite TV, minibar and tea and coffee facilities. Bathrooms have a shower and bidet; some rooms also include a hairdryer and bathrobes.",
    features: ["Air conditioning","Heating","Garden views","Flat-screen satellite TV","Mini-bar","Tea and coffee facilities","Soundproofed rooms","Sitting area","Patio / terrace","Shower and bidet","Free toiletries","Ironing facilities","Cots","In-room breakfast","Room service"]
  }
};
const ar: HotelContent = {
  hotelName:"فندق Opal Legacy Luxor",
  metaDescription:"فندق أوبال ليجاسي الأقصر على البر الشرقي: 40 غرفة مكيفة بإطلالة على الحديقة، مطعم أوبال، بار خارجي، ركوب الخيل، موقف سيارات مجاني وخدمة نقل من المطار.",
  address:"Rd Lead To Esna، الأقصر، مصر",
  nav:{overview:"نظرة عامة",facilities:"مرافق الفندق",location:"الموقع",rooms:"الغرف",
    gallery:"معرض الصور",reviews:"اكتب تعليق",contact:"اتصل بنا"},
  labels:{
    menu:"القائمة",close:"إغلاق",map:"خريطة",bookingTitle:"الحجز عبر الإنترنت",checkin:"تاريخ الوصول",
    checkout:"تاريخ المغادرة",availability:"تحقق من الأماكن المتوفرة",galleryView:"عرض الصورة",
    viewAll:"عرض كل الصور",overviewTitle:"فندق Opal Legacy Luxor",facilitiesTitle:"مرافق الفندق",
    important:"المعلومات الهامة",checkinPolicy:"تسجيل الوصول: من 08:00 حتى 12:00",
    checkoutPolicy:"تسجيل المغادرة: حتى 10:00",locationTitle:"الموقع",nearby:"المعالم السياحية",
    roomsTitle:"الغرف",noDates:"من فضلك، أدخل تواريخ الإقامة للتحقق من الغرف المتوفرة.",
    noBooking:"اختر تواريخ إقامتك وسننقلك إلى طلب الحجز.",
    dateError:"تاريخ المغادرة لازم يكون بعد تاريخ الوصول.",
    reviewsTitle:"اكتب تعليق",name:"الاسم",email:"البريد الإلكتروني",visit:"تاريخ الزيارة",
    rating:"التقييم (من 1 إلى 10)",pros:"الإيجابيات",cons:"السلبيات",
    submitReview:"إرسال التقييم",contactTitle:"اتصل بنا",subject:"الموضوع",message:"الرسالة",
    send:"إرسال الرسالة",noBackend:"تعذّر الإرسال الآن. يُرجى المحاولة مرة أخرى بعد قليل.",
    currency:"العملة",previous:"الصورة السابقة",next:"الصورة التالية",image:"صورة الفندق",
    footerNote:"فندق أوبال ليجاسي الأقصر · طريق إسنا، الأقصر، مصر"
  },
  overview:[
    "يقع فندق أوبال ليجاسي على طريق إسنا بالبر الشرقي في الأقصر، ويضم غرفًا مكيفة بإطلالات على الحديقة ومطعمًا يقدّم قائمة طعام متنوعة.",
    "تضم كل غرفة من غرف الفندق الأربعين تلفزيونًا بشاشة مسطحة مع قنوات فضائية، وميني بار، ومستلزمات إعداد الشاي والقهوة. يحتوي الحمام على دش وشطّاف، وتتوفر في بعض الغرف مجففات شعر وأرواب حمام.",
    "يقدّم مطعم أوبال المأكولات العالمية إلى جانب بار خارجي. استمتع بيومك على تراس التشمس أو في منطقة النزهات، وبأمسيتك في الملهى الليلي، ويمكن ترتيب جولات ركوب الخيل وركوب الدراجات.",
    "معبد الأقصر ومعبد الكرنك على نفس البر: يبعد معبد الأقصر نحو 4.7 كم والكورنيش 4.8 كم. ويستغرق الوصول إلى تمثالي ممنون نحو 15 دقيقة بالسيارة، بينما تبعد ملاهي وحديقة حيوان سوبرانوز لاند نحو 20 دقيقة سيرًا."
  ],
  quick:["واي فاي","موقف سيارات مجاني","مكتب استقبال 24 ساعة","تسجيل سريع للوصول والمغادرة",
    "خدمة نقل المطار","مطعم في الفندق","قاعات اجتماعات","مناسب للأطفال","ركوب الخيل"],
  facilities:[
    {title:"المعلومات العامة",items:["ممنوع التدخين في كل الأماكن","واي فاي","موقف سيارات مجاني","صندوق الإيداع الآمن","مكتب استقبال 24 ساعة","تسجيل الوصول/المغادرة الخاص","تسجيل سريع للوصول والمغادرة","مسموح بدخول الحيوانات الأليفة","غرف/مرافق لذوي الاحتياجات الخاصة","مدخل كراسي متحركة","خدمة الأمن 24 ساعة","خزن الأمتعة","غرف خالية من المواد المسببة للحساسية","تحويل العملات","مقهى","مدفأة","أجهزة إنذار للدخان","مرحاض لذوي الاحتياجات الخاصة","طفايات الحريق"]},
    {title:"الطعام",items:["غلاية الماء الكهربائية","إفطار في الغرفة","مطعم","بار الوجبات الخفيفة","حانة/ردهة","فناء خارجي للأكل","منطقة للتنزه/طاولات","عشاء","وجبات غداء جاهزة","قوائم النظام الغذائي الخاص"]},
    {title:"الأنشطة الرياضية والترفيهية",items:["كراسي للتشمس","فعاليات ترفيهية حية","ملهى ليلي","تراس للتشمس","حديقة","لوازم شواء باربيكيو","غرفة الاستراحة/التلفزيون","ركوب الخيل","ركوب الدراجات","صيد السمك","حمام عمومي"]},
    {title:"الخدمات",items:["خدمة نقل المطار","خدمة الغرف","خدمة تنظيف الغرف","تأجير السيارات","خدمة غسيل الملابس","تنظيف جاف","المساعدة في الجولات/التذاكر","خدمة التسوق","قاعات الاجتماعات/الولائم","فاكس/تصوير المستندات","ساعة السعادة"]},
    {title:"مرافق الغرفة",items:["تكييف","تدفئة","ميني بار","نوافذ عازلة للصوت","منطقة الجلوس","فناء","شرفة","مفروشات الحدائق","مرافق الشاي والقهوة","طاولة الطعام","مرافق الكي","مستلزمات الحمام المجانية","تلفاز بشاشة مسطحة","منبه AM/FM","أسرة أطفال","خدمة مجالسة الأطفال","عربة أطفال","بوفيه للأطفال","منطقة لعب الأطفال"]}
  ],
  attractions:[
    {name:"سالم للمناطيد بالأقصر",distance:"1.5 كم"},
    {name:"ملاهي وحديقة حيوان سوبرانوز لاند",distance:"1.7 كم"},
    {name:"جزيرة الموز",distance:"2.6 كم"},
    {name:"محطة قطار الأقصر",distance:"4.5 كم"},
    {name:"معبد الأقصر",distance:"4.7 كم"},
    {name:"كورنيش الأقصر",distance:"4.8 كم"},
    {name:"مطار الأقصر الدولي",distance:"14 كم"},
    {name:"تمثالا ممنون",distance:"15 دقيقة بالسيارة"}
  ],
  policies:[
    "تسجيل الوصول: من 08:00 حتى 12:00",
    "تسجيل المغادرة: حتى 10:00",
    "يُسمح باصطحاب الحيوانات الأليفة",
    "التدخين ممنوع في جميع أرجاء الفندق",
    "لا يستقبل الفندق حفلات توديع العزوبية وما شابهها"
  ],
  roomFacts:{
    count:"40 غرفة",
    summary:"غرف مكيفة بإطلالة على الحديقة، مع تلفزيون بشاشة مسطحة وقنوات فضائية، وميني بار، ومستلزمات إعداد الشاي والقهوة. الحمام مزود بدش وشطّاف، وتتوفر في بعض الغرف مجففات شعر وأرواب حمام.",
    features:["تكييف","تدفئة","إطلالة على الحديقة","تلفزيون بشاشة مسطحة وقنوات فضائية","ميني بار","مستلزمات الشاي والقهوة","غرف عازلة للصوت","منطقة جلوس","فناء / شرفة","دش وشطّاف","مستلزمات حمام مجانية","مستلزمات الكي","أسرّة أطفال","إفطار في الغرفة","خدمة الغرف"]
  }
};
const content:Record<Locale,HotelContent>={en,ar};
export const getContent=(locale:Locale): HotelContent=>content[locale];

// Facts sourced from the hotel listing at opal-legacy.luxor-hotels-eg.com (Nov 2026),
// rewritten in our own words. Distances follow the listing's location table.
