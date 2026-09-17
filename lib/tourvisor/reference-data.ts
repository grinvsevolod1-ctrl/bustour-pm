// АВТОГЕНЕРАЦИЯ из справочников Tourvisor (Коды городов/стран/курортов).
// Не редактировать вручную: пересобирается парсером из исходных xls Tourvisor.
// Источник числовых кодов для виджетов tv-* и связывания наших стран/курортов.

export type TourvisorDeparture = { readonly code: number; readonly name: string }
export type TourvisorCountry = { readonly code: number; readonly name: string }
export type TourvisorResort = {
  readonly countryCode: number
  readonly countryName: string
  readonly code: number
  readonly name: string
}

export const TOURVISOR_DEPARTURES: readonly TourvisorDeparture[] = [
  {
    "code": 1,
    "name": "Москва"
  },
  {
    "code": 2,
    "name": "Пермь"
  },
  {
    "code": 3,
    "name": "Екатеринбург"
  },
  {
    "code": 4,
    "name": "Уфа"
  },
  {
    "code": 5,
    "name": "С.Петербург"
  },
  {
    "code": 6,
    "name": "Челябинск"
  },
  {
    "code": 7,
    "name": "Самара"
  },
  {
    "code": 8,
    "name": "Н.Новгород"
  },
  {
    "code": 9,
    "name": "Новосибирск"
  },
  {
    "code": 10,
    "name": "Казань"
  },
  {
    "code": 11,
    "name": "Краснодар"
  },
  {
    "code": 12,
    "name": "Красноярск"
  },
  {
    "code": 13,
    "name": "Сургут"
  },
  {
    "code": 14,
    "name": "Тюмень"
  },
  {
    "code": 15,
    "name": "Кемерово"
  },
  {
    "code": 16,
    "name": "Новокузнецк"
  },
  {
    "code": 17,
    "name": "Калининград"
  },
  {
    "code": 18,
    "name": "Ростов-на-Дону"
  },
  {
    "code": 19,
    "name": "Нижнекамск"
  },
  {
    "code": 20,
    "name": "Хабаровск"
  },
  {
    "code": 21,
    "name": "Омск"
  },
  {
    "code": 22,
    "name": "Иркутск"
  },
  {
    "code": 23,
    "name": "Владивосток"
  },
  {
    "code": 24,
    "name": "Ю.Сахалинск"
  },
  {
    "code": 25,
    "name": "Барнаул"
  },
  {
    "code": 26,
    "name": "Воронеж"
  },
  {
    "code": 27,
    "name": "Волгоград"
  },
  {
    "code": 28,
    "name": "Оренбург"
  },
  {
    "code": 29,
    "name": "Архангельск"
  },
  {
    "code": 30,
    "name": "Мурманск"
  },
  {
    "code": 31,
    "name": "Саратов"
  },
  {
    "code": 32,
    "name": "Белгород"
  },
  {
    "code": 33,
    "name": "Харьков"
  },
  {
    "code": 34,
    "name": "Нижневартовск"
  },
  {
    "code": 35,
    "name": "Ханты-Мансийск"
  },
  {
    "code": 36,
    "name": "Благовещенск"
  },
  {
    "code": 37,
    "name": "Якутск"
  },
  {
    "code": 38,
    "name": "Брянск"
  },
  {
    "code": 39,
    "name": "Мин.Воды"
  },
  {
    "code": 40,
    "name": "Астрахань"
  },
  {
    "code": 41,
    "name": "Сыктывкар"
  },
  {
    "code": 42,
    "name": "Улан-Удэ"
  },
  {
    "code": 43,
    "name": "П.Камчатский"
  },
  {
    "code": 44,
    "name": "Чита"
  },
  {
    "code": 45,
    "name": "Братск"
  },
  {
    "code": 46,
    "name": "Владикавказ"
  },
  {
    "code": 47,
    "name": "Курск"
  },
  {
    "code": 48,
    "name": "Магнитогорск"
  },
  {
    "code": 49,
    "name": "Орск"
  },
  {
    "code": 50,
    "name": "Ульяновск"
  },
  {
    "code": 51,
    "name": "Чебоксары"
  },
  {
    "code": 52,
    "name": "Томск"
  },
  {
    "code": 53,
    "name": "Абакан"
  },
  {
    "code": 54,
    "name": "Нальчик"
  },
  {
    "code": 55,
    "name": "Ставрополь"
  },
  {
    "code": 56,
    "name": "Сочи"
  },
  {
    "code": 57,
    "name": "Минск"
  },
  {
    "code": 58,
    "name": "Киев"
  },
  {
    "code": 59,
    "name": "Астана"
  },
  {
    "code": 60,
    "name": "Алматы"
  },
  {
    "code": 61,
    "name": "Наб.Челны"
  },
  {
    "code": 62,
    "name": "Симферополь"
  },
  {
    "code": 63,
    "name": "Анапа"
  },
  {
    "code": 64,
    "name": "Ижевск"
  },
  {
    "code": 65,
    "name": "Пенза"
  },
  {
    "code": 66,
    "name": "Павлодар"
  },
  {
    "code": 67,
    "name": "Новый Уренгой"
  },
  {
    "code": 68,
    "name": "Костанай"
  },
  {
    "code": 69,
    "name": "Гомель"
  },
  {
    "code": 70,
    "name": "Брест"
  },
  {
    "code": 71,
    "name": "Витебск"
  },
  {
    "code": 72,
    "name": "Вильнюс"
  },
  {
    "code": 73,
    "name": "Актобе"
  },
  {
    "code": 74,
    "name": "Актау"
  },
  {
    "code": 75,
    "name": "Атырау"
  },
  {
    "code": 76,
    "name": "Караганды"
  },
  {
    "code": 77,
    "name": "Кызылорда"
  },
  {
    "code": 78,
    "name": "Усть-Каменогорск"
  },
  {
    "code": 79,
    "name": "Шымкент"
  },
  {
    "code": 80,
    "name": "Бишкек"
  },
  {
    "code": 81,
    "name": "Рига"
  },
  {
    "code": 82,
    "name": "Могилев"
  },
  {
    "code": 83,
    "name": "Гродно"
  },
  {
    "code": 84,
    "name": "Уральск"
  },
  {
    "code": 85,
    "name": "Ярославль"
  },
  {
    "code": 86,
    "name": "Винница"
  },
  {
    "code": 87,
    "name": "Днепропетровск"
  },
  {
    "code": 88,
    "name": "Запорожье"
  },
  {
    "code": 89,
    "name": "Ивано-Франковск"
  },
  {
    "code": 90,
    "name": "Кривой Рог"
  },
  {
    "code": 91,
    "name": "Львов"
  },
  {
    "code": 92,
    "name": "Херсон"
  },
  {
    "code": 93,
    "name": "Одесса"
  },
  {
    "code": 94,
    "name": "Махачкала"
  },
  {
    "code": 99,
    "name": "Без перелета"
  }
]

export const TOURVISOR_COUNTRIES: readonly TourvisorCountry[] = [
  {
    "code": 1,
    "name": "Египет"
  },
  {
    "code": 2,
    "name": "Таиланд"
  },
  {
    "code": 3,
    "name": "Индия"
  },
  {
    "code": 4,
    "name": "Турция"
  },
  {
    "code": 5,
    "name": "Тунис"
  },
  {
    "code": 6,
    "name": "Греция"
  },
  {
    "code": 7,
    "name": "Индонезия"
  },
  {
    "code": 8,
    "name": "Мальдивы"
  },
  {
    "code": 9,
    "name": "ОАЭ"
  },
  {
    "code": 10,
    "name": "Куба"
  },
  {
    "code": 11,
    "name": "Доминикана"
  },
  {
    "code": 12,
    "name": "Шри-Ланка"
  },
  {
    "code": 13,
    "name": "Китай"
  },
  {
    "code": 14,
    "name": "Испания"
  },
  {
    "code": 15,
    "name": "Кипр"
  },
  {
    "code": 16,
    "name": "Вьетнам"
  },
  {
    "code": 17,
    "name": "Андорра"
  },
  {
    "code": 18,
    "name": "Мексика"
  },
  {
    "code": 19,
    "name": "Чехия"
  },
  {
    "code": 20,
    "name": "Болгария"
  },
  {
    "code": 21,
    "name": "Черногория"
  },
  {
    "code": 22,
    "name": "Хорватия"
  },
  {
    "code": 23,
    "name": "Марокко"
  },
  {
    "code": 24,
    "name": "Италия"
  },
  {
    "code": 25,
    "name": "Сингапур"
  },
  {
    "code": 26,
    "name": "Филиппины"
  },
  {
    "code": 27,
    "name": "Маврикий"
  },
  {
    "code": 28,
    "name": "Сейшелы"
  },
  {
    "code": 29,
    "name": "Иордания"
  },
  {
    "code": 30,
    "name": "Израиль"
  },
  {
    "code": 31,
    "name": "Австрия"
  },
  {
    "code": 32,
    "name": "Франция"
  },
  {
    "code": 33,
    "name": "Ямайка"
  },
  {
    "code": 34,
    "name": "Финляндия"
  },
  {
    "code": 35,
    "name": "Португалия"
  },
  {
    "code": 36,
    "name": "Малайзия"
  },
  {
    "code": 37,
    "name": "Венгрия"
  },
  {
    "code": 38,
    "name": "Германия"
  },
  {
    "code": 39,
    "name": "Бразилия"
  },
  {
    "code": 40,
    "name": "Камбоджа"
  },
  {
    "code": 41,
    "name": "Танзания"
  },
  {
    "code": 42,
    "name": "Словакия"
  },
  {
    "code": 43,
    "name": "Словения"
  },
  {
    "code": 44,
    "name": "Великобритания"
  },
  {
    "code": 45,
    "name": "Нидерланды"
  },
  {
    "code": 46,
    "name": "Абхазия"
  },
  {
    "code": 47,
    "name": "Россия"
  },
  {
    "code": 48,
    "name": "США"
  },
  {
    "code": 49,
    "name": "Япония"
  },
  {
    "code": 50,
    "name": "Мальта"
  },
  {
    "code": 51,
    "name": "Кения"
  },
  {
    "code": 52,
    "name": "Швейцария"
  },
  {
    "code": 53,
    "name": "Армения"
  },
  {
    "code": 54,
    "name": "Грузия"
  },
  {
    "code": 55,
    "name": "Азербайджан"
  },
  {
    "code": 56,
    "name": "Узбекистан"
  },
  {
    "code": 57,
    "name": "Беларусь"
  },
  {
    "code": 58,
    "name": "Сербия"
  },
  {
    "code": 59,
    "name": "Бахрейн"
  },
  {
    "code": 60,
    "name": "Киргизия"
  },
  {
    "code": 61,
    "name": "Коста-Рика"
  },
  {
    "code": 62,
    "name": "Латвия"
  },
  {
    "code": 63,
    "name": "Литва"
  },
  {
    "code": 64,
    "name": "Оман"
  },
  {
    "code": 65,
    "name": "Польша"
  },
  {
    "code": 66,
    "name": "Румыния"
  },
  {
    "code": 67,
    "name": "Фиджи"
  },
  {
    "code": 68,
    "name": "Фр.Полинезия"
  },
  {
    "code": 69,
    "name": "Эстония"
  },
  {
    "code": 70,
    "name": "Южная Корея"
  },
  {
    "code": 71,
    "name": "Албания"
  },
  {
    "code": 72,
    "name": "Аруба"
  },
  {
    "code": 73,
    "name": "Багамы"
  },
  {
    "code": 74,
    "name": "Бельгия"
  },
  {
    "code": 75,
    "name": "Дания"
  },
  {
    "code": 76,
    "name": "Ирландия"
  },
  {
    "code": 77,
    "name": "Исландия"
  },
  {
    "code": 78,
    "name": "Казахстан"
  },
  {
    "code": 79,
    "name": "Катар"
  },
  {
    "code": 80,
    "name": "Ливан"
  },
  {
    "code": 81,
    "name": "Мьянма"
  },
  {
    "code": 82,
    "name": "Непал"
  },
  {
    "code": 83,
    "name": "Норвегия"
  },
  {
    "code": 84,
    "name": "Швеция"
  },
  {
    "code": 85,
    "name": "ЮАР"
  },
  {
    "code": 86,
    "name": "Гамбия"
  }
]

export const TOURVISOR_RESORTS: readonly TourvisorResort[] = [
  {
    "countryCode": 46,
    "countryName": "Абхазия",
    "code": 418,
    "name": "Гагра"
  },
  {
    "countryCode": 46,
    "countryName": "Абхазия",
    "code": 419,
    "name": "Гудаута"
  },
  {
    "countryCode": 46,
    "countryName": "Абхазия",
    "code": 420,
    "name": "Новый Афон"
  },
  {
    "countryCode": 46,
    "countryName": "Абхазия",
    "code": 422,
    "name": "Пицунда"
  },
  {
    "countryCode": 46,
    "countryName": "Абхазия",
    "code": 421,
    "name": "Сухум"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 200,
    "name": "Бад Гаштайн"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 201,
    "name": "Бад Хофгаштайн"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 202,
    "name": "Баден"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 203,
    "name": "Бургенланд"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 204,
    "name": "Вена"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 205,
    "name": "Верхняя Австрия"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 206,
    "name": "Заальбах-Хинтерглемм"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 207,
    "name": "Зальцбург"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 208,
    "name": "Зеефельд"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 209,
    "name": "Зельден"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 210,
    "name": "Инсбрук"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 211,
    "name": "Ишгль"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 212,
    "name": "Капрун"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 213,
    "name": "Каринтия"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 214,
    "name": "Китцбюэль-Кирхберг"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 215,
    "name": "Лангенфельд"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 216,
    "name": "Лех"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 217,
    "name": "Майрхофен"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 218,
    "name": "Нижняя Австрия"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 219,
    "name": "Нойштифт"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 220,
    "name": "Обергургль-Хохгургль"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 221,
    "name": "Серфаус"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 222,
    "name": "Ст. Антон"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 223,
    "name": "Хинтертукс"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 224,
    "name": "Хиппах"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 225,
    "name": "Цель ам Зее"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 226,
    "name": "Цель ам Циллер"
  },
  {
    "countryCode": 31,
    "countryName": "Австрия",
    "code": 227,
    "name": "Штирия"
  },
  {
    "countryCode": 55,
    "countryName": "Азербайджан",
    "code": 482,
    "name": "Баку"
  },
  {
    "countryCode": 55,
    "countryName": "Азербайджан",
    "code": 484,
    "name": "Габала"
  },
  {
    "countryCode": 55,
    "countryName": "Азербайджан",
    "code": 483,
    "name": "Нафталан"
  },
  {
    "countryCode": 55,
    "countryName": "Азербайджан",
    "code": 520,
    "name": "Шахдаг"
  },
  {
    "countryCode": 55,
    "countryName": "Азербайджан",
    "code": 588,
    "name": "Шеки"
  },
  {
    "countryCode": 71,
    "countryName": "Албания",
    "code": 596,
    "name": "Влера"
  },
  {
    "countryCode": 71,
    "countryName": "Албания",
    "code": 597,
    "name": "Дуррес"
  },
  {
    "countryCode": 71,
    "countryName": "Албания",
    "code": 598,
    "name": "Саранда"
  },
  {
    "countryCode": 17,
    "countryName": "Андорра",
    "code": 93,
    "name": "Андорра ла Велла"
  },
  {
    "countryCode": 17,
    "countryName": "Андорра",
    "code": 95,
    "name": "Канильо"
  },
  {
    "countryCode": 17,
    "countryName": "Андорра",
    "code": 96,
    "name": "Ла Массана"
  },
  {
    "countryCode": 17,
    "countryName": "Андорра",
    "code": 448,
    "name": "Ордино-Аркалис"
  },
  {
    "countryCode": 17,
    "countryName": "Андорра",
    "code": 97,
    "name": "Пал-Аринсал"
  },
  {
    "countryCode": 17,
    "countryName": "Андорра",
    "code": 94,
    "name": "Пас де ла Касса"
  },
  {
    "countryCode": 17,
    "countryName": "Андорра",
    "code": 98,
    "name": "Сольдеу"
  },
  {
    "countryCode": 17,
    "countryName": "Андорра",
    "code": 99,
    "name": "Энкамп"
  },
  {
    "countryCode": 17,
    "countryName": "Андорра",
    "code": 100,
    "name": "Эскальдес"
  },
  {
    "countryCode": 53,
    "countryName": "Армения",
    "code": 474,
    "name": "Джермук"
  },
  {
    "countryCode": 53,
    "countryName": "Армения",
    "code": 473,
    "name": "Ереван"
  },
  {
    "countryCode": 53,
    "countryName": "Армения",
    "code": 573,
    "name": "Севан"
  },
  {
    "countryCode": 53,
    "countryName": "Армения",
    "code": 475,
    "name": "Цахкадзор"
  },
  {
    "countryCode": 72,
    "countryName": "Аруба",
    "code": 609,
    "name": "Аруба"
  },
  {
    "countryCode": 73,
    "countryName": "Багамы",
    "code": 605,
    "name": "Багамы"
  },
  {
    "countryCode": 59,
    "countryName": "Бахрейн",
    "code": 529,
    "name": "Манама"
  },
  {
    "countryCode": 57,
    "countryName": "Беларусь",
    "code": 489,
    "name": "Брестская обл."
  },
  {
    "countryCode": 57,
    "countryName": "Беларусь",
    "code": 490,
    "name": "Витебская обл."
  },
  {
    "countryCode": 57,
    "countryName": "Беларусь",
    "code": 491,
    "name": "Гомельская обл."
  },
  {
    "countryCode": 57,
    "countryName": "Беларусь",
    "code": 492,
    "name": "Гродненская обл."
  },
  {
    "countryCode": 57,
    "countryName": "Беларусь",
    "code": 493,
    "name": "Минская обл."
  },
  {
    "countryCode": 57,
    "countryName": "Беларусь",
    "code": 494,
    "name": "Могилёвская обл."
  },
  {
    "countryCode": 74,
    "countryName": "Бельгия",
    "code": 603,
    "name": "Брюгге"
  },
  {
    "countryCode": 74,
    "countryName": "Бельгия",
    "code": 602,
    "name": "Брюссель"
  },
  {
    "countryCode": 20,
    "countryName": "Болгария",
    "code": 126,
    "name": "Албена"
  },
  {
    "countryCode": 20,
    "countryName": "Болгария",
    "code": 127,
    "name": "Бургас"
  },
  {
    "countryCode": 20,
    "countryName": "Болгария",
    "code": 129,
    "name": "Варна"
  },
  {
    "countryCode": 20,
    "countryName": "Болгария",
    "code": 307,
    "name": "Велико-Тырново"
  },
  {
    "countryCode": 20,
    "countryName": "Болгария",
    "code": 131,
    "name": "Горн.лыжи"
  },
  {
    "countryCode": 20,
    "countryName": "Болгария",
    "code": 130,
    "name": "Золотые Пески"
  },
  {
    "countryCode": 20,
    "countryName": "Болгария",
    "code": 128,
    "name": "Обзор"
  },
  {
    "countryCode": 20,
    "countryName": "Болгария",
    "code": 132,
    "name": "Солнечный Берег"
  },
  {
    "countryCode": 20,
    "countryName": "Болгария",
    "code": 133,
    "name": "София"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 356,
    "name": "Ангра дус Рейс"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 368,
    "name": "Белен"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 359,
    "name": "Бразилиа"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 354,
    "name": "Бузиос"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 355,
    "name": "Игуасу"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 369,
    "name": "Кампу Гранди"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 362,
    "name": "Куритиба"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 367,
    "name": "Манаус"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 360,
    "name": "Минас Жерайс"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 366,
    "name": "Натал"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 365,
    "name": "Порту Алегри"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 364,
    "name": "Ресифе"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 353,
    "name": "Рио де Жанейро"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 358,
    "name": "Сальвадор"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 357,
    "name": "Сан Паулу"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 363,
    "name": "Санта Катарина"
  },
  {
    "countryCode": 39,
    "countryName": "Бразилия",
    "code": 361,
    "name": "Сеара"
  },
  {
    "countryCode": 44,
    "countryName": "Великобритания",
    "code": 462,
    "name": "Лондон"
  },
  {
    "countryCode": 44,
    "countryName": "Великобритания",
    "code": 463,
    "name": "Эдинбург"
  },
  {
    "countryCode": 37,
    "countryName": "Венгрия",
    "code": 334,
    "name": "Балатон"
  },
  {
    "countryCode": 37,
    "countryName": "Венгрия",
    "code": 332,
    "name": "Будапешт"
  },
  {
    "countryCode": 37,
    "countryName": "Венгрия",
    "code": 337,
    "name": "Бюк"
  },
  {
    "countryCode": 37,
    "countryName": "Венгрия",
    "code": 451,
    "name": "Дебрецен"
  },
  {
    "countryCode": 37,
    "countryName": "Венгрия",
    "code": 500,
    "name": "Мишкольц"
  },
  {
    "countryCode": 37,
    "countryName": "Венгрия",
    "code": 336,
    "name": "Хайдусобосло"
  },
  {
    "countryCode": 37,
    "countryName": "Венгрия",
    "code": 333,
    "name": "Хевиз"
  },
  {
    "countryCode": 37,
    "countryName": "Венгрия",
    "code": 335,
    "name": "Шарвар"
  },
  {
    "countryCode": 37,
    "countryName": "Венгрия",
    "code": 339,
    "name": "Шопрон"
  },
  {
    "countryCode": 37,
    "countryName": "Венгрия",
    "code": 522,
    "name": "Эгер"
  },
  {
    "countryCode": 37,
    "countryName": "Венгрия",
    "code": 338,
    "name": "Юж.Задунайский кр."
  },
  {
    "countryCode": 16,
    "countryName": "Вьетнам",
    "code": 134,
    "name": "Вунг Тау"
  },
  {
    "countryCode": 16,
    "countryName": "Вьетнам",
    "code": 103,
    "name": "Дананг"
  },
  {
    "countryCode": 16,
    "countryName": "Вьетнам",
    "code": 87,
    "name": "Нячанг"
  },
  {
    "countryCode": 16,
    "countryName": "Вьетнам",
    "code": 244,
    "name": "Пхан Ранг"
  },
  {
    "countryCode": 16,
    "countryName": "Вьетнам",
    "code": 88,
    "name": "Фантьет"
  },
  {
    "countryCode": 16,
    "countryName": "Вьетнам",
    "code": 104,
    "name": "Фукуок"
  },
  {
    "countryCode": 16,
    "countryName": "Вьетнам",
    "code": 269,
    "name": "Ханой"
  },
  {
    "countryCode": 16,
    "countryName": "Вьетнам",
    "code": 105,
    "name": "Хой Ан"
  },
  {
    "countryCode": 16,
    "countryName": "Вьетнам",
    "code": 245,
    "name": "Хошимин"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 343,
    "name": "Бавария"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 344,
    "name": "Баден Вюртемберг"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 340,
    "name": "Берлин"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 349,
    "name": "Бремен"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 452,
    "name": "Гамбург"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 453,
    "name": "Дрезден"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 346,
    "name": "Дюссельдорф"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 342,
    "name": "Кельн"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 341,
    "name": "Мюнхен"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 345,
    "name": "Озера Германии"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 393,
    "name": "Рейнланд Пфальц"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 347,
    "name": "Франкфурт"
  },
  {
    "countryCode": 38,
    "countryName": "Германия",
    "code": 348,
    "name": "Шлезвиг Гольштейн"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 78,
    "name": "Афины"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 79,
    "name": "Дельфы"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 113,
    "name": "Закинф"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 124,
    "name": "Кавала"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 80,
    "name": "Касторья"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 270,
    "name": "Кефалония"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 390,
    "name": "Киклады"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 109,
    "name": "Корфу"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 110,
    "name": "Кос"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 32,
    "name": "Крит - Ираклион"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 33,
    "name": "Крит - Лассити"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 34,
    "name": "Крит - Ретимно"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 35,
    "name": "Крит - Ханья"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 82,
    "name": "Пелопоннес"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 83,
    "name": "Пиерия"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 111,
    "name": "Родос"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 311,
    "name": "Салоники"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 309,
    "name": "Самос"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 84,
    "name": "Санторини"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 388,
    "name": "Скиатос"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 112,
    "name": "Тасос"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 392,
    "name": "Фессалия"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 85,
    "name": "Халкидики"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 310,
    "name": "Хиос"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 86,
    "name": "Эвия"
  },
  {
    "countryCode": 6,
    "countryName": "Греция",
    "code": 125,
    "name": "Эвритания"
  },
  {
    "countryCode": 54,
    "countryName": "Грузия",
    "code": 499,
    "name": "Бакуриани"
  },
  {
    "countryCode": 54,
    "countryName": "Грузия",
    "code": 480,
    "name": "Батуми"
  },
  {
    "countryCode": 54,
    "countryName": "Грузия",
    "code": 481,
    "name": "Боржоми"
  },
  {
    "countryCode": 54,
    "countryName": "Грузия",
    "code": 477,
    "name": "Гудаури"
  },
  {
    "countryCode": 54,
    "countryName": "Грузия",
    "code": 478,
    "name": "Кахетия"
  },
  {
    "countryCode": 54,
    "countryName": "Грузия",
    "code": 479,
    "name": "Кутаиси"
  },
  {
    "countryCode": 54,
    "countryName": "Грузия",
    "code": 600,
    "name": "Сванетия"
  },
  {
    "countryCode": 54,
    "countryName": "Грузия",
    "code": 476,
    "name": "Тбилиси"
  },
  {
    "countryCode": 54,
    "countryName": "Грузия",
    "code": 566,
    "name": "Уреки"
  },
  {
    "countryCode": 75,
    "countryName": "Дания",
    "code": 606,
    "name": "Биллунд"
  },
  {
    "countryCode": 75,
    "countryName": "Дания",
    "code": 607,
    "name": "Копенгаген"
  },
  {
    "countryCode": 11,
    "countryName": "Доминикана",
    "code": 271,
    "name": "Бока Чика"
  },
  {
    "countryCode": 11,
    "countryName": "Доминикана",
    "code": 50,
    "name": "Ла Романа"
  },
  {
    "countryCode": 11,
    "countryName": "Доминикана",
    "code": 51,
    "name": "Пунта Кана"
  },
  {
    "countryCode": 11,
    "countryName": "Доминикана",
    "code": 149,
    "name": "Пуэрто Плата"
  },
  {
    "countryCode": 11,
    "countryName": "Доминикана",
    "code": 52,
    "name": "Хуан Долио"
  },
  {
    "countryCode": 1,
    "countryName": "Египет",
    "code": 10,
    "name": "Дахаб"
  },
  {
    "countryCode": 1,
    "countryName": "Египет",
    "code": 11,
    "name": "Марса Алам"
  },
  {
    "countryCode": 1,
    "countryName": "Египет",
    "code": 12,
    "name": "Нувейба"
  },
  {
    "countryCode": 1,
    "countryName": "Египет",
    "code": 13,
    "name": "Сафага"
  },
  {
    "countryCode": 1,
    "countryName": "Египет",
    "code": 14,
    "name": "Таба"
  },
  {
    "countryCode": 1,
    "countryName": "Египет",
    "code": 5,
    "name": "Хургада"
  },
  {
    "countryCode": 1,
    "countryName": "Египет",
    "code": 6,
    "name": "Шарм-Эль-Шейх"
  },
  {
    "countryCode": 1,
    "countryName": "Египет",
    "code": 15,
    "name": "Эль Гуна"
  },
  {
    "countryCode": 30,
    "countryName": "Израиль",
    "code": 186,
    "name": "Герцлия"
  },
  {
    "countryCode": 30,
    "countryName": "Израиль",
    "code": 187,
    "name": "Иерусалим"
  },
  {
    "countryCode": 30,
    "countryName": "Израиль",
    "code": 188,
    "name": "Мертвое море"
  },
  {
    "countryCode": 30,
    "countryName": "Израиль",
    "code": 189,
    "name": "Нетания"
  },
  {
    "countryCode": 30,
    "countryName": "Израиль",
    "code": 190,
    "name": "Тверия"
  },
  {
    "countryCode": 30,
    "countryName": "Израиль",
    "code": 191,
    "name": "Тель-Авив"
  },
  {
    "countryCode": 30,
    "countryName": "Израиль",
    "code": 192,
    "name": "Хайфа"
  },
  {
    "countryCode": 30,
    "countryName": "Израиль",
    "code": 193,
    "name": "Эйлат"
  },
  {
    "countryCode": 3,
    "countryName": "Индия",
    "code": 194,
    "name": "Керала"
  },
  {
    "countryCode": 3,
    "countryName": "Индия",
    "code": 372,
    "name": "Нью Дели"
  },
  {
    "countryCode": 3,
    "countryName": "Индия",
    "code": 18,
    "name": "Север Гоа"
  },
  {
    "countryCode": 3,
    "countryName": "Индия",
    "code": 17,
    "name": "Центр Гоа"
  },
  {
    "countryCode": 3,
    "countryName": "Индия",
    "code": 16,
    "name": "Юг Гоа"
  },
  {
    "countryCode": 7,
    "countryName": "Индонезия",
    "code": 37,
    "name": "Бали"
  },
  {
    "countryCode": 7,
    "countryName": "Индонезия",
    "code": 501,
    "name": "Батам"
  },
  {
    "countryCode": 7,
    "countryName": "Индонезия",
    "code": 502,
    "name": "Бинтан"
  },
  {
    "countryCode": 7,
    "countryName": "Индонезия",
    "code": 38,
    "name": "Джимбаран"
  },
  {
    "countryCode": 7,
    "countryName": "Индонезия",
    "code": 39,
    "name": "Кута"
  },
  {
    "countryCode": 7,
    "countryName": "Индонезия",
    "code": 91,
    "name": "Ломбок"
  },
  {
    "countryCode": 7,
    "countryName": "Индонезия",
    "code": 40,
    "name": "Нуса дуа"
  },
  {
    "countryCode": 7,
    "countryName": "Индонезия",
    "code": 41,
    "name": "Санур"
  },
  {
    "countryCode": 29,
    "countryName": "Иордания",
    "code": 182,
    "name": "Акаба"
  },
  {
    "countryCode": 29,
    "countryName": "Иордания",
    "code": 183,
    "name": "Амман"
  },
  {
    "countryCode": 29,
    "countryName": "Иордания",
    "code": 184,
    "name": "Мертвое море"
  },
  {
    "countryCode": 29,
    "countryName": "Иордания",
    "code": 185,
    "name": "Петра"
  },
  {
    "countryCode": 76,
    "countryName": "Ирландия",
    "code": 610,
    "name": "Дублин"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 295,
    "name": "Альмерия"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 68,
    "name": "Барселона"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 293,
    "name": "Валенсия"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 152,
    "name": "Горные лыжи"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 151,
    "name": "Гран Канария"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 297,
    "name": "Ибица"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 574,
    "name": "Коста Бланка"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 69,
    "name": "Коста Брава"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 294,
    "name": "Коста де ла Луз"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 70,
    "name": "Коста Дель Маресме"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 150,
    "name": "Коста Дель Соль"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 71,
    "name": "Коста Дорада"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 296,
    "name": "Коста Тропикаль"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 299,
    "name": "Лансароте"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 272,
    "name": "Мадрид"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 102,
    "name": "Майорка"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 317,
    "name": "Менорка"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 587,
    "name": "Мурсия"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 300,
    "name": "Севилья"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 301,
    "name": "Страна Басков"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 101,
    "name": "Тенерифе"
  },
  {
    "countryCode": 14,
    "countryName": "Испания",
    "code": 298,
    "name": "Фуэртевентура"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 449,
    "name": "Абруццо"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 160,
    "name": "Апулия"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 575,
    "name": "Бибионе"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 229,
    "name": "Бормио"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 228,
    "name": "Валле-ДАоста"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 230,
    "name": "Валь Гардена"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 231,
    "name": "Валь ди Суза"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 232,
    "name": "Валь ди Фасса"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 233,
    "name": "Валь ди Фьемме"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 576,
    "name": "Венето"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 161,
    "name": "Венецианская ривьера"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 577,
    "name": "Венеция"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 578,
    "name": "Верона"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 162,
    "name": "Доломитовые Альпы"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 169,
    "name": "Искья"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 163,
    "name": "Калабрия"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 170,
    "name": "Капри"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 234,
    "name": "Кортина ДАмпеццо"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 235,
    "name": "Кронплатц"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 237,
    "name": "Ливиньо"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 165,
    "name": "Лигурия"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 579,
    "name": "Линьяно"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 239,
    "name": "Мадонна ди Кампильо"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 166,
    "name": "Марке"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 167,
    "name": "Милан"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 168,
    "name": "Неаполитанский залив"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 174,
    "name": "Озера"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 240,
    "name": "Пассо Тонале"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 175,
    "name": "Ривьера-ди-Улиссе"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 176,
    "name": "Рим"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 580,
    "name": "Римини"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 241,
    "name": "Сан Мартина"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 171,
    "name": "Сардиния"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 172,
    "name": "Сицилия"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 164,
    "name": "Термальные курорты"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 177,
    "name": "Тоскана"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 352,
    "name": "Умбрия"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 178,
    "name": "Флоренция"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 173,
    "name": "Эльба"
  },
  {
    "countryCode": 24,
    "countryName": "Италия",
    "code": 179,
    "name": "Эмилия-Романья"
  },
  {
    "countryCode": 40,
    "countryName": "Камбоджа",
    "code": 370,
    "name": "Пномпень"
  },
  {
    "countryCode": 40,
    "countryName": "Камбоджа",
    "code": 371,
    "name": "Сиануквиль"
  },
  {
    "countryCode": 40,
    "countryName": "Камбоджа",
    "code": 385,
    "name": "Сием Рип"
  },
  {
    "countryCode": 79,
    "countryName": "Катар",
    "code": 608,
    "name": "Доха"
  },
  {
    "countryCode": 51,
    "countryName": "Кения",
    "code": 468,
    "name": "Ватаму"
  },
  {
    "countryCode": 51,
    "countryName": "Кения",
    "code": 467,
    "name": "Ламу"
  },
  {
    "countryCode": 51,
    "countryName": "Кения",
    "code": 466,
    "name": "Момбаса"
  },
  {
    "countryCode": 15,
    "countryName": "Кипр",
    "code": 72,
    "name": "Айя Напа"
  },
  {
    "countryCode": 15,
    "countryName": "Кипр",
    "code": 73,
    "name": "Ларнака"
  },
  {
    "countryCode": 15,
    "countryName": "Кипр",
    "code": 74,
    "name": "Лимассол"
  },
  {
    "countryCode": 15,
    "countryName": "Кипр",
    "code": 75,
    "name": "Никосия"
  },
  {
    "countryCode": 15,
    "countryName": "Кипр",
    "code": 76,
    "name": "Пафос"
  },
  {
    "countryCode": 15,
    "countryName": "Кипр",
    "code": 77,
    "name": "Протарас"
  },
  {
    "countryCode": 60,
    "countryName": "Киргизия",
    "code": 530,
    "name": "Иссык-Куль"
  },
  {
    "countryCode": 60,
    "countryName": "Киргизия",
    "code": 572,
    "name": "Каракол"
  },
  {
    "countryCode": 13,
    "countryName": "Китай",
    "code": 321,
    "name": "Бэйдайхэ"
  },
  {
    "countryCode": 13,
    "countryName": "Китай",
    "code": 302,
    "name": "Гонконг"
  },
  {
    "countryCode": 13,
    "countryName": "Китай",
    "code": 247,
    "name": "Гуанчжоу"
  },
  {
    "countryCode": 13,
    "countryName": "Китай",
    "code": 308,
    "name": "Ляонин"
  },
  {
    "countryCode": 13,
    "countryName": "Китай",
    "code": 65,
    "name": "Пекин"
  },
  {
    "countryCode": 13,
    "countryName": "Китай",
    "code": 560,
    "name": "Урумчи"
  },
  {
    "countryCode": 13,
    "countryName": "Китай",
    "code": 584,
    "name": "Хайнань"
  },
  {
    "countryCode": 13,
    "countryName": "Китай",
    "code": 246,
    "name": "Шанхай"
  },
  {
    "countryCode": 61,
    "countryName": "Коста-Рика",
    "code": 532,
    "name": "Гуанакасте"
  },
  {
    "countryCode": 61,
    "countryName": "Коста-Рика",
    "code": 571,
    "name": "Пунтаренас"
  },
  {
    "countryCode": 61,
    "countryName": "Коста-Рика",
    "code": 531,
    "name": "Сан-Хосе"
  },
  {
    "countryCode": 10,
    "countryName": "Куба",
    "code": 49,
    "name": "Варадеро"
  },
  {
    "countryCode": 10,
    "countryName": "Куба",
    "code": 92,
    "name": "Гавана"
  },
  {
    "countryCode": 10,
    "countryName": "Куба",
    "code": 147,
    "name": "Лос-Канарреос"
  },
  {
    "countryCode": 10,
    "countryName": "Куба",
    "code": 148,
    "name": "Ольгин"
  },
  {
    "countryCode": 10,
    "countryName": "Куба",
    "code": 521,
    "name": "Тринидад"
  },
  {
    "countryCode": 62,
    "countryName": "Латвия",
    "code": 533,
    "name": "Рига"
  },
  {
    "countryCode": 62,
    "countryName": "Латвия",
    "code": 534,
    "name": "Юрмала"
  },
  {
    "countryCode": 63,
    "countryName": "Литва",
    "code": 535,
    "name": "Вильнюс"
  },
  {
    "countryCode": 63,
    "countryName": "Литва",
    "code": 537,
    "name": "Друскининкай"
  },
  {
    "countryCode": 63,
    "countryName": "Литва",
    "code": 583,
    "name": "Каунас"
  },
  {
    "countryCode": 63,
    "countryName": "Литва",
    "code": 582,
    "name": "Клайпеда"
  },
  {
    "countryCode": 63,
    "countryName": "Литва",
    "code": 536,
    "name": "Паланга"
  },
  {
    "countryCode": 27,
    "countryName": "Маврикий",
    "code": 195,
    "name": "Маврикий"
  },
  {
    "countryCode": 36,
    "countryName": "Малайзия",
    "code": 326,
    "name": "Калимантан"
  },
  {
    "countryCode": 36,
    "countryName": "Малайзия",
    "code": 327,
    "name": "Куала Лумпур"
  },
  {
    "countryCode": 36,
    "countryName": "Малайзия",
    "code": 328,
    "name": "Лангкави"
  },
  {
    "countryCode": 36,
    "countryName": "Малайзия",
    "code": 329,
    "name": "Пангкор"
  },
  {
    "countryCode": 36,
    "countryName": "Малайзия",
    "code": 325,
    "name": "Пенанг"
  },
  {
    "countryCode": 36,
    "countryName": "Малайзия",
    "code": 330,
    "name": "Реданг"
  },
  {
    "countryCode": 36,
    "countryName": "Малайзия",
    "code": 331,
    "name": "Тиоман"
  },
  {
    "countryCode": 8,
    "countryName": "Мальдивы",
    "code": 42,
    "name": "Мальдивы"
  },
  {
    "countryCode": 50,
    "countryName": "Мальта",
    "code": 447,
    "name": "Аттард"
  },
  {
    "countryCode": 50,
    "countryName": "Мальта",
    "code": 439,
    "name": "Валлетта"
  },
  {
    "countryCode": 50,
    "countryName": "Мальта",
    "code": 441,
    "name": "Гозо"
  },
  {
    "countryCode": 50,
    "countryName": "Мальта",
    "code": 440,
    "name": "Комино"
  },
  {
    "countryCode": 50,
    "countryName": "Мальта",
    "code": 446,
    "name": "Мдина"
  },
  {
    "countryCode": 50,
    "countryName": "Мальта",
    "code": 442,
    "name": "Меллиха"
  },
  {
    "countryCode": 50,
    "countryName": "Мальта",
    "code": 443,
    "name": "Сент Джулианс"
  },
  {
    "countryCode": 50,
    "countryName": "Мальта",
    "code": 445,
    "name": "Сент Полс Бэй"
  },
  {
    "countryCode": 50,
    "countryName": "Мальта",
    "code": 444,
    "name": "Слима"
  },
  {
    "countryCode": 23,
    "countryName": "Марокко",
    "code": 157,
    "name": "Агадир"
  },
  {
    "countryCode": 23,
    "countryName": "Марокко",
    "code": 158,
    "name": "Касабланка"
  },
  {
    "countryCode": 23,
    "countryName": "Марокко",
    "code": 159,
    "name": "Марракеш"
  },
  {
    "countryCode": 23,
    "countryName": "Марокко",
    "code": 251,
    "name": "Рабат"
  },
  {
    "countryCode": 23,
    "countryName": "Марокко",
    "code": 279,
    "name": "Танжер"
  },
  {
    "countryCode": 23,
    "countryName": "Марокко",
    "code": 280,
    "name": "Уарзазат"
  },
  {
    "countryCode": 23,
    "countryName": "Марокко",
    "code": 351,
    "name": "Уджда"
  },
  {
    "countryCode": 23,
    "countryName": "Марокко",
    "code": 250,
    "name": "Фес"
  },
  {
    "countryCode": 23,
    "countryName": "Марокко",
    "code": 252,
    "name": "Эль-Джадида"
  },
  {
    "countryCode": 23,
    "countryName": "Марокко",
    "code": 281,
    "name": "Эрфуд"
  },
  {
    "countryCode": 23,
    "countryName": "Марокко",
    "code": 249,
    "name": "Эссуэйра"
  },
  {
    "countryCode": 18,
    "countryName": "Мексика",
    "code": 106,
    "name": "Канкун"
  },
  {
    "countryCode": 18,
    "countryName": "Мексика",
    "code": 319,
    "name": "Косумель"
  },
  {
    "countryCode": 18,
    "countryName": "Мексика",
    "code": 320,
    "name": "Лос Кабос"
  },
  {
    "countryCode": 18,
    "countryName": "Мексика",
    "code": 318,
    "name": "Мехико"
  },
  {
    "countryCode": 18,
    "countryName": "Мексика",
    "code": 107,
    "name": "Плайя Дель Кармен"
  },
  {
    "countryCode": 18,
    "countryName": "Мексика",
    "code": 108,
    "name": "Ривьера Майя"
  },
  {
    "countryCode": 45,
    "countryName": "Нидерланды",
    "code": 465,
    "name": "Амстердам"
  },
  {
    "countryCode": 45,
    "countryName": "Нидерланды",
    "code": 464,
    "name": "Гаага"
  },
  {
    "countryCode": 9,
    "countryName": "ОАЭ",
    "code": 43,
    "name": "Абу-Даби"
  },
  {
    "countryCode": 9,
    "countryName": "ОАЭ",
    "code": 44,
    "name": "Аджман"
  },
  {
    "countryCode": 9,
    "countryName": "ОАЭ",
    "code": 45,
    "name": "Дубай"
  },
  {
    "countryCode": 9,
    "countryName": "ОАЭ",
    "code": 373,
    "name": "Дубай-Джумейра"
  },
  {
    "countryCode": 9,
    "countryName": "ОАЭ",
    "code": 46,
    "name": "Рас-эль-Хайм"
  },
  {
    "countryCode": 9,
    "countryName": "ОАЭ",
    "code": 601,
    "name": "Умм Аль Кувейн"
  },
  {
    "countryCode": 9,
    "countryName": "ОАЭ",
    "code": 47,
    "name": "Фуджейра"
  },
  {
    "countryCode": 9,
    "countryName": "ОАЭ",
    "code": 48,
    "name": "Шарджа"
  },
  {
    "countryCode": 64,
    "countryName": "Оман",
    "code": 538,
    "name": "Маскат"
  },
  {
    "countryCode": 64,
    "countryName": "Оман",
    "code": 539,
    "name": "Салала"
  },
  {
    "countryCode": 65,
    "countryName": "Польша",
    "code": 540,
    "name": "Варшава"
  },
  {
    "countryCode": 65,
    "countryName": "Польша",
    "code": 570,
    "name": "Закопане"
  },
  {
    "countryCode": 65,
    "countryName": "Польша",
    "code": 542,
    "name": "Краков"
  },
  {
    "countryCode": 65,
    "countryName": "Польша",
    "code": 567,
    "name": "Лечебные курорты"
  },
  {
    "countryCode": 65,
    "countryName": "Польша",
    "code": 541,
    "name": "Тройгород"
  },
  {
    "countryCode": 35,
    "countryName": "Португалия",
    "code": 314,
    "name": "Азорские острова"
  },
  {
    "countryCode": 35,
    "countryName": "Португалия",
    "code": 312,
    "name": "Алгарве"
  },
  {
    "countryCode": 35,
    "countryName": "Португалия",
    "code": 313,
    "name": "Лиссабон"
  },
  {
    "countryCode": 35,
    "countryName": "Португалия",
    "code": 315,
    "name": "Мадейра"
  },
  {
    "countryCode": 35,
    "countryName": "Португалия",
    "code": 316,
    "name": "Порту"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 518,
    "name": "Абзаково / Банное"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 564,
    "name": "Азовское море"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 496,
    "name": "Алтай"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 427,
    "name": "Анапа"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 525,
    "name": "Архыз"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 565,
    "name": "Байкал"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 471,
    "name": "Великий Устюг"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 428,
    "name": "Геленджик"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 523,
    "name": "Домбай"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 527,
    "name": "Золотое Кольцо"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 424,
    "name": "Кав. Мин. Воды"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 517,
    "name": "Казань"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 425,
    "name": "Калининградская обл."
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 526,
    "name": "Карелия"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 495,
    "name": "Красная Поляна"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 423,
    "name": "Крым"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 469,
    "name": "Москва/Подмосковье"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 524,
    "name": "Приэльбрусье"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 528,
    "name": "Самарская обл."
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 470,
    "name": "Санкт-Петербург"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 426,
    "name": "Сочи"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 429,
    "name": "Туапсе"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 563,
    "name": "Урал"
  },
  {
    "countryCode": 47,
    "countryName": "Россия",
    "code": 498,
    "name": "Шерегеш"
  },
  {
    "countryCode": 66,
    "countryName": "Румыния",
    "code": 543,
    "name": "Бухарест"
  },
  {
    "countryCode": 66,
    "countryName": "Румыния",
    "code": 545,
    "name": "Констанца"
  },
  {
    "countryCode": 66,
    "countryName": "Румыния",
    "code": 546,
    "name": "Мамая"
  },
  {
    "countryCode": 66,
    "countryName": "Румыния",
    "code": 544,
    "name": "Мангалия"
  },
  {
    "countryCode": 66,
    "countryName": "Румыния",
    "code": 547,
    "name": "Эфорие"
  },
  {
    "countryCode": 28,
    "countryName": "Сейшелы",
    "code": 196,
    "name": "Сейшелы"
  },
  {
    "countryCode": 58,
    "countryName": "Сербия",
    "code": 505,
    "name": "Белград"
  },
  {
    "countryCode": 58,
    "countryName": "Сербия",
    "code": 516,
    "name": "Велико-Градиште"
  },
  {
    "countryCode": 58,
    "countryName": "Сербия",
    "code": 506,
    "name": "Горн.лыжи"
  },
  {
    "countryCode": 58,
    "countryName": "Сербия",
    "code": 512,
    "name": "Златибор"
  },
  {
    "countryCode": 58,
    "countryName": "Сербия",
    "code": 515,
    "name": "Суботица"
  },
  {
    "countryCode": 58,
    "countryName": "Сербия",
    "code": 562,
    "name": "Термальные курорты"
  },
  {
    "countryCode": 25,
    "countryName": "Сингапур",
    "code": 181,
    "name": "Сентоза"
  },
  {
    "countryCode": 25,
    "countryName": "Сингапур",
    "code": 180,
    "name": "Сингапур"
  },
  {
    "countryCode": 42,
    "countryName": "Словакия",
    "code": 402,
    "name": "Бардеевские Купели"
  },
  {
    "countryCode": 42,
    "countryName": "Словакия",
    "code": 394,
    "name": "Братислава"
  },
  {
    "countryCode": 42,
    "countryName": "Словакия",
    "code": 395,
    "name": "Высокие Татры"
  },
  {
    "countryCode": 42,
    "countryName": "Словакия",
    "code": 398,
    "name": "Дудинце"
  },
  {
    "countryCode": 42,
    "countryName": "Словакия",
    "code": 396,
    "name": "Низкие Татры"
  },
  {
    "countryCode": 42,
    "countryName": "Словакия",
    "code": 397,
    "name": "Пиештяны"
  },
  {
    "countryCode": 42,
    "countryName": "Словакия",
    "code": 399,
    "name": "Раецке Теплице"
  },
  {
    "countryCode": 42,
    "countryName": "Словакия",
    "code": 400,
    "name": "Смрдаки"
  },
  {
    "countryCode": 42,
    "countryName": "Словакия",
    "code": 403,
    "name": "Тренчьянске Теплице"
  },
  {
    "countryCode": 42,
    "countryName": "Словакия",
    "code": 401,
    "name": "Турчанске Теплице"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 406,
    "name": "Адриатика"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 416,
    "name": "Добрна"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 410,
    "name": "Доленске Топлице"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 414,
    "name": "Лашко"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 404,
    "name": "Любляна"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 407,
    "name": "Моравске Топлице"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 405,
    "name": "Озера"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 417,
    "name": "Римске Топлице"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 409,
    "name": "Рогашка Слатина"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 413,
    "name": "Терме Олимия"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 411,
    "name": "Терме Раденци"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 412,
    "name": "Терме Чатеж"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 408,
    "name": "Шмарьешке Топлице"
  },
  {
    "countryCode": 43,
    "countryName": "Словения",
    "code": 415,
    "name": "Юлийские Альпы"
  },
  {
    "countryCode": 48,
    "countryName": "США",
    "code": 569,
    "name": "Вашингтон"
  },
  {
    "countryCode": 48,
    "countryName": "США",
    "code": 438,
    "name": "Гавайи"
  },
  {
    "countryCode": 48,
    "countryName": "США",
    "code": 568,
    "name": "Горные лыжи"
  },
  {
    "countryCode": 48,
    "countryName": "США",
    "code": 430,
    "name": "Гуам"
  },
  {
    "countryCode": 48,
    "countryName": "США",
    "code": 434,
    "name": "Лас-Вегас"
  },
  {
    "countryCode": 48,
    "countryName": "США",
    "code": 435,
    "name": "Лос-Анджелес"
  },
  {
    "countryCode": 48,
    "countryName": "США",
    "code": 436,
    "name": "Майами"
  },
  {
    "countryCode": 48,
    "countryName": "США",
    "code": 433,
    "name": "Нью-Йорк"
  },
  {
    "countryCode": 48,
    "countryName": "США",
    "code": 431,
    "name": "Сайпан"
  },
  {
    "countryCode": 48,
    "countryName": "США",
    "code": 437,
    "name": "Чикаго"
  },
  {
    "countryCode": 2,
    "countryName": "Таиланд",
    "code": 62,
    "name": "Бангкок"
  },
  {
    "countryCode": 2,
    "countryName": "Таиланд",
    "code": 90,
    "name": "Као Лак"
  },
  {
    "countryCode": 2,
    "countryName": "Таиланд",
    "code": 61,
    "name": "Ко Чанг"
  },
  {
    "countryCode": 2,
    "countryName": "Таиланд",
    "code": 60,
    "name": "Краби"
  },
  {
    "countryCode": 2,
    "countryName": "Таиланд",
    "code": 7,
    "name": "Паттайя"
  },
  {
    "countryCode": 2,
    "countryName": "Таиланд",
    "code": 8,
    "name": "Пхукет"
  },
  {
    "countryCode": 2,
    "countryName": "Таиланд",
    "code": 89,
    "name": "Районг"
  },
  {
    "countryCode": 2,
    "countryName": "Таиланд",
    "code": 9,
    "name": "Самуи"
  },
  {
    "countryCode": 2,
    "countryName": "Таиланд",
    "code": 63,
    "name": "Хуа Хин"
  },
  {
    "countryCode": 2,
    "countryName": "Таиланд",
    "code": 519,
    "name": "Чианг Май"
  },
  {
    "countryCode": 41,
    "countryName": "Танзания",
    "code": 386,
    "name": "Дар эс Салам"
  },
  {
    "countryCode": 41,
    "countryName": "Танзания",
    "code": 387,
    "name": "Занзибар"
  },
  {
    "countryCode": 5,
    "countryName": "Тунис",
    "code": 323,
    "name": "Гаммарт"
  },
  {
    "countryCode": 5,
    "countryName": "Тунис",
    "code": 153,
    "name": "Джерба"
  },
  {
    "countryCode": 5,
    "countryName": "Тунис",
    "code": 28,
    "name": "Махдия"
  },
  {
    "countryCode": 5,
    "countryName": "Тунис",
    "code": 29,
    "name": "Монастир"
  },
  {
    "countryCode": 5,
    "countryName": "Тунис",
    "code": 30,
    "name": "Сусс"
  },
  {
    "countryCode": 5,
    "countryName": "Тунис",
    "code": 322,
    "name": "Табарка"
  },
  {
    "countryCode": 5,
    "countryName": "Тунис",
    "code": 31,
    "name": "Хаммамет"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 19,
    "name": "Алания"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 20,
    "name": "Анталия"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 21,
    "name": "Белек"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 24,
    "name": "Бодрум"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 25,
    "name": "Даламан"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 155,
    "name": "Дидим"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 306,
    "name": "Измир"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 586,
    "name": "Кайсери"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 22,
    "name": "Кемер"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 154,
    "name": "Кушадасы"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 26,
    "name": "Мармарис"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 599,
    "name": "Невшехир"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 23,
    "name": "Сиде"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 277,
    "name": "Стамбул"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 268,
    "name": "Улудаг"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 27,
    "name": "Фетхие"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 156,
    "name": "Чешме"
  },
  {
    "countryCode": 4,
    "countryName": "Турция",
    "code": 278,
    "name": "Эрзурум"
  },
  {
    "countryCode": 56,
    "countryName": "Узбекистан",
    "code": 485,
    "name": "Бухара"
  },
  {
    "countryCode": 56,
    "countryName": "Узбекистан",
    "code": 486,
    "name": "Самарканд"
  },
  {
    "countryCode": 56,
    "countryName": "Узбекистан",
    "code": 487,
    "name": "Ташкент"
  },
  {
    "countryCode": 56,
    "countryName": "Узбекистан",
    "code": 488,
    "name": "Хива"
  },
  {
    "countryCode": 67,
    "countryName": "Фиджи",
    "code": 556,
    "name": "Фиджи"
  },
  {
    "countryCode": 26,
    "countryName": "Филиппины",
    "code": 197,
    "name": "Боракай"
  },
  {
    "countryCode": 26,
    "countryName": "Филиппины",
    "code": 198,
    "name": "Бохоль"
  },
  {
    "countryCode": 26,
    "countryName": "Филиппины",
    "code": 350,
    "name": "Лусон"
  },
  {
    "countryCode": 26,
    "countryName": "Филиппины",
    "code": 248,
    "name": "Палаван"
  },
  {
    "countryCode": 26,
    "countryName": "Филиппины",
    "code": 199,
    "name": "Себу"
  },
  {
    "countryCode": 34,
    "countryName": "Финляндия",
    "code": 290,
    "name": "Восточная Финляндия"
  },
  {
    "countryCode": 34,
    "countryName": "Финляндия",
    "code": 291,
    "name": "Западная Финляндия"
  },
  {
    "countryCode": 34,
    "countryName": "Финляндия",
    "code": 288,
    "name": "Лапландия"
  },
  {
    "countryCode": 34,
    "countryName": "Финляндия",
    "code": 289,
    "name": "Оулу"
  },
  {
    "countryCode": 34,
    "countryName": "Финляндия",
    "code": 287,
    "name": "Хельсинки"
  },
  {
    "countryCode": 34,
    "countryName": "Финляндия",
    "code": 292,
    "name": "Южная Финляндия"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 253,
    "name": "Аквитания"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 376,
    "name": "Земли Луары"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 324,
    "name": "Корсика"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 258,
    "name": "Лазурный берег"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 374,
    "name": "Лангедок Руссильон"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 375,
    "name": "Нор Па де Кале"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 381,
    "name": "Нормандия"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 262,
    "name": "Парадиски"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 263,
    "name": "Париж"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 379,
    "name": "Пиренеи"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 264,
    "name": "Порт дю Солей"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 377,
    "name": "Пуату Шаранта"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 265,
    "name": "Рона Альпы"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 266,
    "name": "Савойя"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 450,
    "name": "Три Долины"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 382,
    "name": "Эльзас"
  },
  {
    "countryCode": 32,
    "countryName": "Франция",
    "code": 267,
    "name": "Эспас Килли"
  },
  {
    "countryCode": 68,
    "countryName": "Французская Полинезия",
    "code": 557,
    "name": "Бора-Бора"
  },
  {
    "countryCode": 68,
    "countryName": "Французская Полинезия",
    "code": 559,
    "name": "Острова Полинезии"
  },
  {
    "countryCode": 68,
    "countryName": "Французская Полинезия",
    "code": 558,
    "name": "Таити"
  },
  {
    "countryCode": 22,
    "countryName": "Хорватия",
    "code": 276,
    "name": "Загреб"
  },
  {
    "countryCode": 22,
    "countryName": "Хорватия",
    "code": 143,
    "name": "Истрия"
  },
  {
    "countryCode": 22,
    "countryName": "Хорватия",
    "code": 144,
    "name": "Северная Далмация"
  },
  {
    "countryCode": 22,
    "countryName": "Хорватия",
    "code": 145,
    "name": "Средняя Далмация"
  },
  {
    "countryCode": 22,
    "countryName": "Хорватия",
    "code": 146,
    "name": "Южная Далмация"
  },
  {
    "countryCode": 21,
    "countryName": "Черногория",
    "code": 135,
    "name": "Бар"
  },
  {
    "countryCode": 21,
    "countryName": "Черногория",
    "code": 136,
    "name": "Бечичи"
  },
  {
    "countryCode": 21,
    "countryName": "Черногория",
    "code": 137,
    "name": "Будва"
  },
  {
    "countryCode": 21,
    "countryName": "Черногория",
    "code": 138,
    "name": "Герцег Нови"
  },
  {
    "countryCode": 21,
    "countryName": "Черногория",
    "code": 273,
    "name": "Горн. лыжи"
  },
  {
    "countryCode": 21,
    "countryName": "Черногория",
    "code": 139,
    "name": "Котор"
  },
  {
    "countryCode": 21,
    "countryName": "Черногория",
    "code": 140,
    "name": "Петровац"
  },
  {
    "countryCode": 21,
    "countryName": "Черногория",
    "code": 274,
    "name": "Подгорица"
  },
  {
    "countryCode": 21,
    "countryName": "Черногория",
    "code": 141,
    "name": "Святой Стефан"
  },
  {
    "countryCode": 21,
    "countryName": "Черногория",
    "code": 275,
    "name": "Тиват"
  },
  {
    "countryCode": 21,
    "countryName": "Черногория",
    "code": 142,
    "name": "Ульцин"
  },
  {
    "countryCode": 19,
    "countryName": "Чехия",
    "code": 114,
    "name": "Дарков"
  },
  {
    "countryCode": 19,
    "countryName": "Чехия",
    "code": 115,
    "name": "Карловы Вары"
  },
  {
    "countryCode": 19,
    "countryName": "Чехия",
    "code": 116,
    "name": "Крконоши"
  },
  {
    "countryCode": 19,
    "countryName": "Чехия",
    "code": 117,
    "name": "Лазне Белоград"
  },
  {
    "countryCode": 19,
    "countryName": "Чехия",
    "code": 118,
    "name": "Марианские Лазне"
  },
  {
    "countryCode": 19,
    "countryName": "Чехия",
    "code": 119,
    "name": "Подебрады"
  },
  {
    "countryCode": 19,
    "countryName": "Чехия",
    "code": 120,
    "name": "Прага"
  },
  {
    "countryCode": 19,
    "countryName": "Чехия",
    "code": 121,
    "name": "Теплице"
  },
  {
    "countryCode": 19,
    "countryName": "Чехия",
    "code": 122,
    "name": "Франтишкови Лазне"
  },
  {
    "countryCode": 19,
    "countryName": "Чехия",
    "code": 123,
    "name": "Яхимов"
  },
  {
    "countryCode": 52,
    "countryName": "Швейцария",
    "code": 461,
    "name": "Бад Рагац"
  },
  {
    "countryCode": 52,
    "countryName": "Швейцария",
    "code": 454,
    "name": "Берн"
  },
  {
    "countryCode": 52,
    "countryName": "Швейцария",
    "code": 457,
    "name": "Вале"
  },
  {
    "countryCode": 52,
    "countryName": "Швейцария",
    "code": 458,
    "name": "Граубюнден"
  },
  {
    "countryCode": 52,
    "countryName": "Швейцария",
    "code": 455,
    "name": "Женева"
  },
  {
    "countryCode": 52,
    "countryName": "Швейцария",
    "code": 459,
    "name": "Женевское озеро"
  },
  {
    "countryCode": 52,
    "countryName": "Швейцария",
    "code": 460,
    "name": "Люцернское озеро"
  },
  {
    "countryCode": 52,
    "countryName": "Швейцария",
    "code": 456,
    "name": "Цюрих"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 589,
    "name": "Аругам Бей"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 53,
    "name": "Бентота"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 590,
    "name": "Галле"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 54,
    "name": "Калутара"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 591,
    "name": "Канди"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 55,
    "name": "Коггала"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 56,
    "name": "Коломбо"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 57,
    "name": "Негомбо"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 58,
    "name": "Сигирия"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 592,
    "name": "Тангалле"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 59,
    "name": "Тринкомале"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 593,
    "name": "Унаватуна"
  },
  {
    "countryCode": 12,
    "countryName": "Шри-Ланка",
    "code": 594,
    "name": "Хиккадува"
  },
  {
    "countryCode": 69,
    "countryName": "Эстония",
    "code": 552,
    "name": "Вирумаа"
  },
  {
    "countryCode": 69,
    "countryName": "Эстония",
    "code": 551,
    "name": "Пярну"
  },
  {
    "countryCode": 69,
    "countryName": "Эстония",
    "code": 549,
    "name": "Сааремаа"
  },
  {
    "countryCode": 69,
    "countryName": "Эстония",
    "code": 548,
    "name": "Таллин"
  },
  {
    "countryCode": 69,
    "countryName": "Эстония",
    "code": 550,
    "name": "Тарту"
  },
  {
    "countryCode": 69,
    "countryName": "Эстония",
    "code": 585,
    "name": "Хаапсалу"
  },
  {
    "countryCode": 70,
    "countryName": "Южная Корея",
    "code": 555,
    "name": "Пусан"
  },
  {
    "countryCode": 70,
    "countryName": "Южная Корея",
    "code": 553,
    "name": "Сеул"
  },
  {
    "countryCode": 70,
    "countryName": "Южная Корея",
    "code": 554,
    "name": "Чеджу"
  },
  {
    "countryCode": 33,
    "countryName": "Ямайка",
    "code": 283,
    "name": "Вестморлэнд"
  },
  {
    "countryCode": 33,
    "countryName": "Ямайка",
    "code": 303,
    "name": "Кингстон"
  },
  {
    "countryCode": 33,
    "countryName": "Ямайка",
    "code": 282,
    "name": "Монтего Бэй"
  },
  {
    "countryCode": 33,
    "countryName": "Ямайка",
    "code": 284,
    "name": "Очо Риос"
  },
  {
    "countryCode": 33,
    "countryName": "Ямайка",
    "code": 305,
    "name": "Порт Антонио"
  },
  {
    "countryCode": 33,
    "countryName": "Ямайка",
    "code": 285,
    "name": "Раневей Бэй"
  },
  {
    "countryCode": 33,
    "countryName": "Ямайка",
    "code": 286,
    "name": "Южное побережье"
  },
  {
    "countryCode": 49,
    "countryName": "Япония",
    "code": 503,
    "name": "Киото"
  },
  {
    "countryCode": 49,
    "countryName": "Япония",
    "code": 432,
    "name": "Окинава"
  },
  {
    "countryCode": 49,
    "countryName": "Япония",
    "code": 504,
    "name": "Осака"
  },
  {
    "countryCode": 49,
    "countryName": "Япония",
    "code": 472,
    "name": "Токио"
  }
]
