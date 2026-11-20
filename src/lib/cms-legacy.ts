/**
 * Content that shipped as a built-in default in earlier releases.
 * A published CMS snapshot that still holds one of these exact values was never
 * edited by the owner, so it is upgraded to the current default on read.
 * Anything the owner changed is left untouched.
 * Generated from git history (pre-#23, #23 and #24 hotel-content.ts / cms-schema.ts).
 */
import type { Locale } from "@/lib/hotel-content";
import type { CmsHeading, CmsSectionId } from "@/lib/cms-schema";

type LegacyField = "metaDescription" | "overview" | "quick" | "facilities" | "attractions";
export const legacyContent: Record<Locale, Record<LegacyField, unknown[]>> = {
 "en": {
  "metaDescription": [
   "Discover Hotel Opal Legacy Luxor, its rooms, amenities, gallery, and location near Luxor attractions.",
   "Opal Legacy Luxor Hotel on Luxor's East Bank: 40 air-conditioned rooms with garden views, the Opal restaurant, outdoor bar, horseback riding, free parking and airport shuttle."
  ],
  "overview": [
   [
    "Opal Legacy Luxor Hotel offers air-conditioned accommodation and a restaurant in Luxor. The property features traditional architectural details and gardens.",
    "Rooms feature satellite flat-screen televisions, tea and coffee-making facilities, and selected views of the garden.",
    "Guests can enjoy outdoor seating and leisure activities. Horse riding and cycling are listed among the activities offered."
   ],
   [
    "Opal Legacy Luxor Hotel sits on the road to Esna on Luxor's East Bank, with air-conditioned rooms, garden views and an à la carte restaurant.",
    "Each of the hotel's 40 rooms has a flat-screen TV with satellite channels, a minibar and tea and coffee facilities. Bathrooms come with a shower and bidet, and some rooms add a hairdryer and bathrobes.",
    "The Opal restaurant serves international cuisine alongside an outdoor bar. Spend the day on the sun terrace or in the picnic area, the evening at the nightclub, or ask the team to arrange horseback-riding tours and cycling.",
    "Luxor Temple and the Temple of Karnak are on the same bank: Luxor Temple is about 4.7 km away and the Corniche 4.8 km. The Colossi of Memnon are around 15 minutes by car, and Sopranos Land amusement park and zoo is roughly a 20-minute walk."
   ]
  ],
  "quick": [
   [
    "Wi-Fi",
    "24-hour reception",
    "Express check-in/-out",
    "Horseback riding",
    "Airport shuttle",
    "Restaurant",
    "Child-friendly",
    "Wheelchair access"
   ],
   [
    "Wi-Fi",
    "Free parking",
    "24-hour reception",
    "Express check-in/-out",
    "Airport shuttle",
    "On-site dining",
    "Meeting facilities",
    "Child-friendly",
    "Horseback riding"
   ]
  ],
  "facilities": [
   [
    {
     "title": "General",
     "items": [
      "No smoking on site",
      "Wi-Fi",
      "Parking",
      "Safe deposit box",
      "24-hour reception",
      "VIP check-in/-out",
      "Express check-in/-out",
      "Pets allowed",
      "Rooms/Facilities for disabled",
      "Wheelchair access",
      "24-hour security",
      "Luggage storage",
      "Allergy-free rooms",
      "Currency exchange",
      "Coffee shop",
      "Fireplace",
      "Smoke detectors",
      "Toilet for disabled",
      "Fire extinguishers"
     ]
    },
    {
     "title": "Dining",
     "items": [
      "Electric kettle",
      "In-room breakfast",
      "Restaurant",
      "Snack bar",
      "Bar/Lounge area",
      "Outdoor dining area",
      "Picnic area/Tables",
      "Dinner",
      "Packed lunches",
      "Special diet menus"
     ]
    },
    {
     "title": "Leisure & Sports",
     "items": [
      "Sun loungers",
      "Live entertainment",
      "Night club",
      "Sun terrace",
      "Garden area",
      "BBQ facilities",
      "Leisure/TV room",
      "Horseback riding",
      "Cycling",
      "Fishing",
      "Public Bath"
     ]
    },
    {
     "title": "Services",
     "items": [
      "Airport shuttle",
      "Room service",
      "Housekeeping",
      "Car hire",
      "Laundry",
      "Dry cleaning",
      "Tours/Ticket assistance",
      "Grocery shopping service",
      "Meeting/Banquet facilities",
      "Fax/Photocopying",
      "Happy hour"
     ]
    },
    {
     "title": "Room Amenities",
     "items": [
      "Air conditioning",
      "Heating",
      "Mini-bar",
      "Soundproofed rooms",
      "Sitting area",
      "Patio",
      "Terrace",
      "Garden furniture",
      "Tea and coffee facilities",
      "Dining table",
      "Ironing facilities",
      "Free toiletries",
      "Flat-screen TV",
      "AM/FM alarm clock",
      "Cots",
      "Babysitting/Child services",
      "Baby pushchair",
      "Children's buffet",
      "Children's play area"
     ]
    }
   ],
   [
    {
     "title": "General",
     "items": [
      "No smoking on site",
      "Wi-Fi",
      "Free parking",
      "Safe deposit box",
      "24-hour reception",
      "VIP check-in/-out",
      "Express check-in/-out",
      "Pets allowed",
      "Rooms/Facilities for disabled",
      "Wheelchair access",
      "24-hour security",
      "Luggage storage",
      "Allergy-free rooms",
      "Currency exchange",
      "Coffee shop",
      "Fireplace",
      "Smoke detectors",
      "Toilet for disabled",
      "Fire extinguishers"
     ]
    },
    {
     "title": "Dining",
     "items": [
      "Electric kettle",
      "In-room breakfast",
      "Restaurant",
      "Snack bar",
      "Bar/Lounge area",
      "Outdoor dining area",
      "Picnic area/Tables",
      "Dinner",
      "Packed lunches",
      "Special diet menus"
     ]
    },
    {
     "title": "Leisure & Sports",
     "items": [
      "Sun loungers",
      "Live entertainment",
      "Night club",
      "Sun terrace",
      "Garden area",
      "BBQ facilities",
      "Leisure/TV room",
      "Horseback riding",
      "Cycling",
      "Fishing",
      "Public Bath"
     ]
    },
    {
     "title": "Services",
     "items": [
      "Airport shuttle",
      "Room service",
      "Housekeeping",
      "Car hire",
      "Laundry",
      "Dry cleaning",
      "Tours/Ticket assistance",
      "Grocery shopping service",
      "Meeting/Banquet facilities",
      "Fax/Photocopying",
      "Happy hour"
     ]
    },
    {
     "title": "Room Amenities",
     "items": [
      "Air conditioning",
      "Heating",
      "Mini-bar",
      "Soundproofed rooms",
      "Sitting area",
      "Patio",
      "Terrace",
      "Garden furniture",
      "Tea and coffee facilities",
      "Dining table",
      "Ironing facilities",
      "Free toiletries",
      "Flat-screen TV",
      "AM/FM alarm clock",
      "Cots",
      "Babysitting/Child services",
      "Baby pushchair",
      "Children's buffet",
      "Children's play area"
     ]
    }
   ]
  ],
  "attractions": [
   [
    {
     "name": "Salem Hot Air Balloons Luxor",
     "distance": "1.5 km"
    },
    {
     "name": "Banana Island",
     "distance": "2.6 km"
    },
    {
     "name": "Local Tours Egypt",
     "distance": "2.4 km"
    },
    {
     "name": "Luxor International Airport",
     "distance": "14 km"
    },
    {
     "name": "Luxor Train Station",
     "distance": "4.5 km"
    }
   ],
   [
    {
     "name": "Nady Land Amusement Park & Zoo",
     "distance": "1.4 km"
    },
    {
     "name": "Salem Hot Air Balloons Luxor",
     "distance": "1.5 km"
    },
    {
     "name": "Banana Island",
     "distance": "2.6 km"
    },
    {
     "name": "Luxor Train Station",
     "distance": "4.5 km"
    },
    {
     "name": "Luxor Temple",
     "distance": "4.6 km"
    },
    {
     "name": "Luxor International Airport",
     "distance": "14 km"
    }
   ],
   [
    {
     "name": "Salem Hot Air Balloons Luxor",
     "distance": "1.5 km"
    },
    {
     "name": "Sopranos Land amusement park & zoo",
     "distance": "1.7 km"
    },
    {
     "name": "Banana Island",
     "distance": "2.6 km"
    },
    {
     "name": "Luxor Train Station",
     "distance": "4.5 km"
    },
    {
     "name": "Luxor Temple",
     "distance": "4.7 km"
    },
    {
     "name": "Luxor Corniche",
     "distance": "4.8 km"
    },
    {
     "name": "Luxor International Airport",
     "distance": "14 km"
    },
    {
     "name": "Colossi of Memnon",
     "distance": "15 min by car"
    }
   ]
  ]
 },
 "ar": {
  "metaDescription": [
   "تعرف على فندق أوبال ليجاسي بالأقصر والمرافق والموقع والصور.",
   "فندق أوبال ليجاسي الأقصر على البر الشرقي: 40 غرفة مكيفة بإطلالة على الحديقة، مطعم أوبال، بار خارجي، ركوب الخيل، موقف سيارات مجاني وخدمة نقل من المطار."
  ],
  "overview": [
   [
    "يقع فندق Opal Legacy Luxor في الأقصر، ويوفر إقامة مكيفة ومرافق لاستقبال الضيوف ومطعمًا.",
    "تتميز الغرف بتفاصيل معمارية تقليدية، وتحتوي على تلفزيون ومرافق إعداد الشاي والقهوة، وتطل بعض الغرف على الحديقة.",
    "تشمل المرافق مناطق جلوس خارجية وأنشطة ترفيهية متنوعة مثل ركوب الخيل وركوب الدراجات."
   ],
   [
    "يقع فندق أوبال ليجاسي على طريق إسنا بالبر الشرقي في الأقصر، ويضم غرفًا مكيفة بإطلالات على الحديقة ومطعمًا يقدّم قائمة طعام متنوعة.",
    "تضم كل غرفة من غرف الفندق الأربعين تلفزيونًا بشاشة مسطحة مع قنوات فضائية، وميني بار، ومستلزمات إعداد الشاي والقهوة. يحتوي الحمام على دش وشطّاف، وتتوفر في بعض الغرف مجففات شعر وأرواب حمام.",
    "يقدّم مطعم أوبال المأكولات العالمية إلى جانب بار خارجي. استمتع بيومك على تراس التشمس أو في منطقة النزهات، وبأمسيتك في الملهى الليلي، ويمكن ترتيب جولات ركوب الخيل وركوب الدراجات.",
    "معبد الأقصر ومعبد الكرنك على نفس البر: يبعد معبد الأقصر نحو 4.7 كم والكورنيش 4.8 كم. ويستغرق الوصول إلى تمثالي ممنون نحو 15 دقيقة بالسيارة، بينما تبعد ملاهي وحديقة حيوان سوبرانوز لاند نحو 20 دقيقة سيرًا."
   ]
  ],
  "quick": [
   [
    "واي فاي",
    "مكتب استقبال 24 ساعة",
    "تسجيل سريع للوصول والمغادرة",
    "ركوب الخيل",
    "خدمة نقل المطار",
    "مطعم",
    "مناسب للأطفال",
    "مدخل كراسي متحركة"
   ],
   [
    "واي فاي",
    "موقف سيارات مجاني",
    "مكتب استقبال 24 ساعة",
    "تسجيل سريع للوصول والمغادرة",
    "خدمة نقل المطار",
    "مطعم في الفندق",
    "قاعات اجتماعات",
    "مناسب للأطفال",
    "ركوب الخيل"
   ]
  ],
  "facilities": [
   [
    {
     "title": "المعلومات العامة",
     "items": [
      "ممنوع التدخين في كل الأماكن",
      "واي فاي",
      "موقف السيارات",
      "صندوق الإيداع الآمن",
      "مكتب استقبال 24 ساعة",
      "تسجيل الوصول/المغادرة الخاص",
      "تسجيل سريع للوصول والمغادرة",
      "مسموح بدخول الحيوانات الأليفة",
      "غرف/مرافق لذوي الاحتياجات الخاصة",
      "مدخل كراسي متحركة",
      "خدمة الأمن 24 ساعة",
      "خزن الأمتعة",
      "غرف خالية من المواد المسببة للحساسية",
      "تحويل العملات",
      "مقهى",
      "مدفأة",
      "أجهزة إنذار للدخان",
      "مرحاض لذوي الاحتياجات الخاصة",
      "طفايات الحريق"
     ]
    },
    {
     "title": "الطعام",
     "items": [
      "غلاية الماء الكهربائية",
      "إفطار في الغرفة",
      "مطعم",
      "بار الوجبات الخفيفة",
      "حانة/ردهة",
      "فناء خارجي للأكل",
      "منطقة للتنزه/طاولات",
      "عشاء",
      "وجبات غداء جاهزة",
      "قوائم النظام الغذائي الخاص"
     ]
    },
    {
     "title": "الأنشطة الرياضية والترفيهية",
     "items": [
      "كراسي للتشمس",
      "فعاليات ترفيهية حية",
      "ملهى ليلي",
      "تراس للتشمس",
      "حديقة",
      "لوازم شواء باربيكيو",
      "غرفة الاستراحة/التلفزيون",
      "ركوب الخيل",
      "ركوب الدراجات",
      "صيد السمك",
      "حمام عمومي"
     ]
    },
    {
     "title": "الخدمات",
     "items": [
      "خدمة نقل المطار",
      "خدمة الغرف",
      "خدمة تنظيف الغرف",
      "تأجير السيارات",
      "خدمة غسيل الملابس",
      "تنظيف جاف",
      "المساعدة في الجولات/التذاكر",
      "خدمة التسوق",
      "قاعات الاجتماعات/الولائم",
      "فاكس/تصوير المستندات",
      "ساعة السعادة"
     ]
    },
    {
     "title": "مرافق الغرفة",
     "items": [
      "تكييف",
      "تدفئة",
      "ميني بار",
      "نوافذ عازلة للصوت",
      "منطقة الجلوس",
      "فناء",
      "شرفة",
      "مفروشات الحدائق",
      "مرافق الشاي والقهوة",
      "طاولة الطعام",
      "مرافق الكي",
      "مستلزمات الحمام المجانية",
      "تلفاز بشاشة مسطحة",
      "منبه AM/FM",
      "أسرة أطفال",
      "خدمة مجالسة الأطفال",
      "عربة أطفال",
      "بوفيه للأطفال",
      "منطقة لعب الأطفال"
     ]
    }
   ],
   [
    {
     "title": "المعلومات العامة",
     "items": [
      "ممنوع التدخين في كل الأماكن",
      "واي فاي",
      "موقف سيارات مجاني",
      "صندوق الإيداع الآمن",
      "مكتب استقبال 24 ساعة",
      "تسجيل الوصول/المغادرة الخاص",
      "تسجيل سريع للوصول والمغادرة",
      "مسموح بدخول الحيوانات الأليفة",
      "غرف/مرافق لذوي الاحتياجات الخاصة",
      "مدخل كراسي متحركة",
      "خدمة الأمن 24 ساعة",
      "خزن الأمتعة",
      "غرف خالية من المواد المسببة للحساسية",
      "تحويل العملات",
      "مقهى",
      "مدفأة",
      "أجهزة إنذار للدخان",
      "مرحاض لذوي الاحتياجات الخاصة",
      "طفايات الحريق"
     ]
    },
    {
     "title": "الطعام",
     "items": [
      "غلاية الماء الكهربائية",
      "إفطار في الغرفة",
      "مطعم",
      "بار الوجبات الخفيفة",
      "حانة/ردهة",
      "فناء خارجي للأكل",
      "منطقة للتنزه/طاولات",
      "عشاء",
      "وجبات غداء جاهزة",
      "قوائم النظام الغذائي الخاص"
     ]
    },
    {
     "title": "الأنشطة الرياضية والترفيهية",
     "items": [
      "كراسي للتشمس",
      "فعاليات ترفيهية حية",
      "ملهى ليلي",
      "تراس للتشمس",
      "حديقة",
      "لوازم شواء باربيكيو",
      "غرفة الاستراحة/التلفزيون",
      "ركوب الخيل",
      "ركوب الدراجات",
      "صيد السمك",
      "حمام عمومي"
     ]
    },
    {
     "title": "الخدمات",
     "items": [
      "خدمة نقل المطار",
      "خدمة الغرف",
      "خدمة تنظيف الغرف",
      "تأجير السيارات",
      "خدمة غسيل الملابس",
      "تنظيف جاف",
      "المساعدة في الجولات/التذاكر",
      "خدمة التسوق",
      "قاعات الاجتماعات/الولائم",
      "فاكس/تصوير المستندات",
      "ساعة السعادة"
     ]
    },
    {
     "title": "مرافق الغرفة",
     "items": [
      "تكييف",
      "تدفئة",
      "ميني بار",
      "نوافذ عازلة للصوت",
      "منطقة الجلوس",
      "فناء",
      "شرفة",
      "مفروشات الحدائق",
      "مرافق الشاي والقهوة",
      "طاولة الطعام",
      "مرافق الكي",
      "مستلزمات الحمام المجانية",
      "تلفاز بشاشة مسطحة",
      "منبه AM/FM",
      "أسرة أطفال",
      "خدمة مجالسة الأطفال",
      "عربة أطفال",
      "بوفيه للأطفال",
      "منطقة لعب الأطفال"
     ]
    }
   ]
  ],
  "attractions": [
   [
    {
     "name": "Salem Hot Air Balloons Luxor",
     "distance": "1.5 كم"
    },
    {
     "name": "ملاهي وحديقة حيوان الندي لاند",
     "distance": "1.4 كم"
    },
    {
     "name": "Luxor Temple",
     "distance": "4.6 كم"
    },
    {
     "name": "مطار الأقصر الدولي",
     "distance": "14 كم"
    },
    {
     "name": "محطة قطار الأقصر",
     "distance": "4.5 كم"
    }
   ],
   [
    {
     "name": "ملاهي وحديقة حيوان الندي لاند",
     "distance": "1.4 كم"
    },
    {
     "name": "سالم للمناطيد بالأقصر",
     "distance": "1.5 كم"
    },
    {
     "name": "جزيرة الموز",
     "distance": "2.6 كم"
    },
    {
     "name": "محطة قطار الأقصر",
     "distance": "4.5 كم"
    },
    {
     "name": "معبد الأقصر",
     "distance": "4.6 كم"
    },
    {
     "name": "مطار الأقصر الدولي",
     "distance": "14 كم"
    }
   ],
   [
    {
     "name": "سالم للمناطيد بالأقصر",
     "distance": "1.5 كم"
    },
    {
     "name": "ملاهي وحديقة حيوان سوبرانوز لاند",
     "distance": "1.7 كم"
    },
    {
     "name": "جزيرة الموز",
     "distance": "2.6 كم"
    },
    {
     "name": "محطة قطار الأقصر",
     "distance": "4.5 كم"
    },
    {
     "name": "معبد الأقصر",
     "distance": "4.7 كم"
    },
    {
     "name": "كورنيش الأقصر",
     "distance": "4.8 كم"
    },
    {
     "name": "مطار الأقصر الدولي",
     "distance": "14 كم"
    },
    {
     "name": "تمثالا ممنون",
     "distance": "15 دقيقة بالسيارة"
    }
   ]
  ]
 }
};

export const legacyHeadings: Record<Locale, Record<CmsSectionId, CmsHeading>> = {
  en:{
    overview:{kicker:"THE OPAL EXPERIENCE",title:"Beyond a stay,",accent:"a feeling.",description:"A place to discover more slowly. Inspired by the textures, light and timeless atmosphere of Luxor."},
    facilities:{kicker:"CONSIDERED COMFORTS",title:"Little details.",accent:"Lasting impressions.",description:"Thoughtful touches and room to slow down."},
    location:{kicker:"A SENSE OF PLACE",title:"Rooted in",accent:"Luxor.",description:"Every journey begins somewhere. Discover the hotel's location."},
    rooms:{kicker:"THE ART OF REST",title:"Rooms to slow down.",accent:"Moments to stay.",description:"Editorial room concepts. Not confirmed inventory."},
    gallery:{kicker:"VISUAL JOURNAL",title:"A closer look.",accent:"Every angle.",description:"Illustrative visual inspiration until hotel assets are approved."},
    reviews:{kicker:"THE GUEST JOURNAL",title:"Some memories",accent:"deserve a story.",description:"A space to share memories. Reviews are not yet submitted."},
    contact:{kicker:"LET'S TALK",title:"Have a question?",accent:"Let's connect.",description:"Explore the future contact experience. Messages are not delivered."},
  },
  ar:{
    overview:{kicker:"تجربة أوبال",title:"وراء كل إقامة",accent:"حكاية.",description:"هنا تلتقي تفاصيل المكان بروح الأقصر."},
    facilities:{kicker:"راحة في كل تفصيلة",title:"تفاصيل بسيطة.",accent:"تفرق كتير.",description:"الراحة تبدأ من التفاصيل."},
    location:{kicker:"الموقع",title:"في قلب",accent:"الحكاية.",description:"اكتشف موقع الفندق وما حوله من معالم."},
    rooms:{kicker:"تجربة الغرف",title:"غرف للراحة.",accent:"لحظات بتفضل.",description:"تصورات تصميمية وليست مخزون غرف متاح للحجز."},
    gallery:{kicker:"نظرة أقرب",title:"جمال التفاصيل.",accent:"من كل زاوية.",description:"صور للإلهام البصري لحين اعتماد الصور الحقيقية."},
    reviews:{kicker:"كلمات تترك أثرًا",title:"بعض الذكريات",accent:"تستحق الحكاية.",description:"معاينة فقط، لم يتم تفعيل إرسال التقييمات."},
    contact:{kicker:"تواصل مع المكان",title:"عندك سؤال؟",accent:"خلّينا نتكلم.",description:"معاينة لتجربة التواصل ولم يتم تفعيل الإرسال."},
  }
};
