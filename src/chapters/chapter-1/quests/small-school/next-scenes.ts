import {
  choice,
  dialogue,
  flag,
  relation,
  requiresFlag,
  route,
  skill,
  setBackground,
} from "../../../../story/questDsl";
/**
 * The black phone is always controlled by Dmit.
 * PhoneMessenger alignment is explicit per line: Dmit = outgoing/right; everyone else = incoming/left.
 * Dialogue sounds and effects are attached to one line only to avoid repeated playback/application.
 */
export const smallSchoolExitNodes = [
  route({
    id: "school-exit-entry",
    routes: [
      ["GUARD_RECOGNIZED_BLACK_PHONE", "guard-recognized-phone"],
      ["DMIT_TOOK_BLAME_FOR_VADIM", "guard-controlled-exit"],
      ["DMIT_BLAMED_VADIM", "guard-controlled-exit"],
      ["SCHOOL_BREAK_IN_FAILED", "guard-controlled-exit"],
      ["GUARD_ESCORT_TO_BACKPACK", "guard-controlled-exit"],
      ["DMIT_RETURNED_FOR_VADIM", "exit-returned-vadim"],
      ["DMIT_DOUBLE_ABANDONMENT", "exit-alone-start"],
      ["DMIT_ABANDONED_VADIM", "exit-alone-start"],
    ],
    fallback: "exit-together-start",
  }),
  /*
   * ВЕТКА: ОХРАННИК УЗНАЛ ЧЁРНЫЙ ТЕЛЕФОН
   */
  dialogue({
    id: "guard-recognized-phone",
    cast: ["Дмит", "Охранник"],
    tone: "danger",
    lines: [
      [
        "Рассказчик",
        "Охранник смотрит на чёрный телефон и резко перестаёт ругаться.",
        {
          ...setBackground("computer-class-night"),
        },
      ],
      ["Охранник", "Где вы это взяли?"],
      ["Дмит", "На столе лежал."],
      ["Охранник", "Телефон сюда. Быстро."],
      ["Дмит", "А он чей?"],
      ["Охранник", "Не твоё дело."],
      [
        "Рассказчик",
        "Охранник говорит тише обычного и постоянно поглядывает в сторону коридора.",
      ],
    ],
    next: "guard-phone-holder-route",
  }),
  route({
    id: "guard-phone-holder-route",
    routes: [
      ["BLACK_PHONE_DESTROYED", "guard-phone-destroyed"],
      ["BLACK_PHONE_CONFISCATED", "guard-release-warning"],
      ["BLACK_PHONE_LEFT_AT_SCHOOL", "guard-phone-left"],
      ["DMIT_HAS_BLACK_PHONE", "guard-phone-dmit"],
    ],
    fallback: "guard-phone-left",
  }),
  dialogue({
    id: "guard-phone-dmit",
    cast: ["Дмит", "Охранник"],
    tone: "danger",
    lines: [
      [
        "Рассказчик",
        "Чёрный телефон лежит в кармане Дмита. Даже через ткань чувствуется его тяжёлый корпус.",
      ],
      ["Охранник", "Я видел, как ты его убрал. Доставай."],
      ["Дмит", "Может, сначала объясните, чё с ним не так?"],
      ["Охранник", "Сейчас же."],
    ],
    next: "guard-phone-dmit-choice",
  }),
  choice({
    id: "guard-phone-dmit-choice",
    cast: ["Дмит", "Охранник"],
    tone: "danger",
    prompt: "Что сделать с чёрным телефоном?",
    options: [
      {
        text: "Отдать телефон охраннику.",
        next: "guard-takes-phone",
        effects: [flag("BLACK_PHONE_CONFISCATED")],
      },
      {
        text: "Сказать, что телефон остался на столе.",
        check: skill("Харизма", 3),
        next: "guard-phone-hidden",
        failNext: "guard-finds-phone",
      },
      {
        text: "Спросить, знает ли он Игоря.",
        require: requiresFlag("BLACK_PHONE_MESSAGES_READ"),
        next: "guard-igor-question",
      },
      {
        text: "Молча отойти к Вадиму.",
        next: "guard-finds-phone",
      },
    ],
  }),
  dialogue({
    id: "guard-takes-phone",
    cast: ["Дмит", "Охранник"],
    tone: "danger",
    lines: [
      [
        "Рассказчик",
        "Охранник выхватывает телефон и сразу убирает его во внутренний карман.",
      ],
      ["Дмит", "Вы хоть владельца знаете?"],
      ["Охранник", "Забудь, что видел его."],
      ["Дмит", "Так не получится."],
      ["Охранник", "Получится, если голова на плечах дорога."],
      [
        "Рассказчик",
        "Впервые за весь вечер в его голосе нет злости. Только страх.",
      ],
    ],
    next: "guard-release-warning",
  }),
  dialogue({
    id: "guard-phone-hidden",
    cast: ["Дмит", "Охранник"],
    tone: "danger",
    lines: [
      ["Дмит", "Он на столе остался. Мы ничего не брали."],
      ["Охранник", "Точно?"],
      ["Дмит", "Можете проверить."],
      [
        "Рассказчик",
        "Охранник смотрит в сторону учительского стола, но не подходит ближе.",
      ],
      ["Охранник", "Всё. На выход."],
      ["Дмит", "А телефон?"],
      [
        "Охранник",
        "Забудь про него.",
        {
          effects: [flag("DMIT_KEPT_BLACK_PHONE_HIDDEN")],
        },
      ],
    ],
    next: "guard-release-warning",
  }),
  dialogue({
    id: "guard-finds-phone",
    cast: ["Дмит", "Охранник"],
    tone: "danger",
    lines: [
      ["Дмит", "Телефон на столе остался."],
      ["Охранник", "Тогда почему у тебя карман вибрирует?"],
      ["Рассказчик", "Чёрный телефон снова коротко гудит в кармане Дмита."],
      ["Дмит", "Бля."],
      ["Охранник", "Достал."],
      [
        "Рассказчик",
        "Охранник забирает телефон, не дожидаясь ответа.",
        {
          effects: [flag("BLACK_PHONE_CONFISCATED")],
        },
      ],
    ],
    next: "guard-release-warning",
  }),
  dialogue({
    id: "guard-igor-question",
    cast: ["Дмит", "Охранник"],
    tone: "danger",
    lines: [
      ["Дмит", "А вы Игоря знаете?"],
      [
        "Рассказчик",
        "Охранник застывает. Его взгляд на секунду становится совершенно пустым.",
      ],
      ["Охранник", "Какого Игоря?"],
      ["Дмит", "Который деньги должен передать."],
      ["Охранник", "Телефон сюда."],
      ["Дмит", "Значит, знаете."],
      ["Охранник", "Я сказал — телефон сюда!"],
    ],
    next: "guard-igor-choice",
  }),
  choice({
    id: "guard-igor-choice",
    cast: ["Дмит", "Охранник"],
    tone: "danger",
    prompt: "Как ответить охраннику?",
    options: [
      {
        text: "Отдать телефон.",
        next: "guard-takes-phone",
        effects: [
          flag("BLACK_PHONE_CONFISCATED"),
          flag("GUARD_REACTED_TO_IGOR"),
        ],
      },
      {
        text: "Спрятать телефон и отступить.",
        check: skill("Ловкость", 3),
        next: "guard-phone-hidden",
        failNext: "guard-finds-phone",
      },
      {
        text: "Мы уже прочитали сообщения.",
        next: "guard-read-messages-reaction",
        effects: [flag("GUARD_KNOWS_MESSAGES_WERE_READ")],
      },
    ],
  }),
  dialogue({
    id: "guard-read-messages-reaction",
    cast: ["Дмит", "Охранник"],
    tone: "danger",
    lines: [
      ["Дмит", "Поздно. Мы уже прочитали сообщения."],
      ["Охранник", "Кто ещё видел?"],
      ["Дмит", "А чё там такого?"],
      ["Охранник", "Кто ещё видел?!"],
      [
        "Вадим",
        "Я.",
        {
          cast: ["Вадим", "Охранник"],
        },
      ],
      ["Рассказчик", "Охранник проводит ладонью по лицу и тихо ругается."],
      [
        "Охранник",
        "Уходите через боковой выход. И никому ничего не рассказывайте.",
      ],
      ["Дмит", "Почему через боковой?"],
      [
        "Охранник",
        "Потому что у главного вам сейчас находиться не надо.",
        {
          effects: [flag("GUARD_SENT_GROUP_TO_SIDE_EXIT")],
        },
      ],
    ],
    next: "guard-side-exit",
  }),
  dialogue({
    id: "guard-phone-destroyed",
    cast: ["Дмит", "Охранник"],
    tone: "danger",
    lines: [
      ["Охранник", "Где телефон?"],
      ["Дмит", "Разбился."],
      ["Охранник", "Что значит «разбился»?"],
      ["Дмит", "Упал. Потом я на него наступил."],
      [
        "Вадим",
        "Он сделал это специально.",
        {
          cast: ["Вадим", "Охранник"],
        },
      ],
      ["Дмит", "Вадим."],
      ["Охранник", "Вы вообще понимаете, что натворили?"],
      ["Дмит", "Пока не очень."],
      [
        "Охранник",
        "На выход. Быстро.",
        {
          effects: [flag("GUARD_KNOWS_BLACK_PHONE_DESTROYED")],
        },
      ],
    ],
    next: "guard-release-warning",
  }),
  dialogue({
    id: "guard-phone-left",
    cast: ["Дмит", "Охранник"],
    tone: "danger",
    lines: [
      ["Охранник", "Телефон оставили на месте?"],
      ["Дмит", "Да."],
      ["Охранник", "Ничего не трогали?"],
      ["Дмит", "Рюкзак взяли. За ним пришли."],
      ["Охранник", "Хорошо. Теперь уходите."],
      [
        "Вадим",
        "Вы знаете, чей он?",
        {
          cast: ["Вадим", "Охранник"],
        },
      ],
      ["Охранник", "Нет. И вы тоже не знаете."],
    ],
    next: "guard-release-warning",
  }),
  /*
   * ВЕТКА: ДМИТ И ВАДИМ УЖЕ НАХОДЯТСЯ ПОД КОНТРОЛЕМ ОХРАННИКА
   */
  dialogue({
    id: "guard-controlled-exit",
    cast: ["Дмит", "Охранник"],
    lines: [
      [
        "Охранник",
        "Рюкзак забрали. Теперь оба вниз.",
        {
          ...setBackground("computer-class-night"),
        },
      ],
      ["Дмит", "А можно просто выйти?"],
      ["Охранник", "Я вас и веду выходить."],
      ["Дмит", "Без директора?"],
      ["Охранник", "Не радуйся раньше времени."],
    ],
    next: "guard-blame-route",
  }),
  route({
    id: "guard-blame-route",
    routes: [
      ["DMIT_TOOK_BLAME_FOR_VADIM", "guard-took-blame-reaction"],
      ["DMIT_BLAMED_VADIM", "guard-blamed-vadim-reaction"],
    ],
    fallback: "guard-neutral-reaction",
  }),
  dialogue({
    id: "guard-took-blame-reaction",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Вадим",
        "Ты не обязан был брать всё на себя.",
        {
          ...setBackground("school-second-floor-night"),
        },
      ],
      ["Дмит", "Ты утром на олимпиаду едешь."],
      ["Вадим", "Это не отменяет твоих проблем."],
      ["Дмит", "Зато добавляет твоих умных разговоров."],
      ["Вадим", "Спасибо."],
      ["Дмит", "Вот так лучше. Коротко."],
    ],
    next: "guard-release-warning",
  }),
  dialogue({
    id: "guard-blamed-vadim-reaction",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Дмит",
        "Ты долго ещё молчать будешь?",
        {
          ...setBackground("school-second-floor-night"),
        },
      ],
      ["Вадим", "Пока не появится что-то, что я хочу тебе сказать."],
      ["Дмит", "Я же не соврал. Ты рюкзак забыл."],
      ["Вадим", "А ты решил помочь. Потом переложил всё на меня."],
      ["Дмит", "Нас поймали. Я затупил."],
      ["Вадим", "Я заметил."],
    ],
    next: "guard-release-warning",
  }),
  dialogue({
    id: "guard-neutral-reaction",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Вадим",
        "По крайней мере, рюкзак мы забрали.",
        {
          ...setBackground("school-second-floor-night"),
        },
      ],
      ["Дмит", "Я же говорил, план работает."],
      ["Вадим", "Нас поймали."],
      ["Дмит", "Не весь план. Основная часть."],
    ],
    next: "guard-release-warning",
  }),
  dialogue({
    id: "guard-release-warning",
    cast: ["Дмит", "Охранник"],
    lines: [
      ["Рассказчик", "Охранник ведёт ребят по лестнице к первому этажу."],
      ["Охранник", "Сейчас выйдете и сразу пойдёте домой."],
      ["Дмит", "А родителям?"],
      ["Охранник", "Утром школа сама решит."],
      [
        "Вадим",
        "То есть вы нас отпускаете?",
        {
          cast: ["Вадим", "Охранник"],
        },
      ],
      ["Охранник", "Я вас больше видеть не хочу."],
      ["Дмит", "Взаимно."],
      ["Охранник", "Что?"],
      ["Дмит", "Говорю, спасибо."],
    ],
    next: "guard-main-exit",
  }),
  dialogue({
    id: "guard-main-exit",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Рассказчик",
        "Охранник открывает главную дверь и почти выталкивает ребят на улицу.",
        {
          ...setBackground("school-main-entrance-night"),
          sound: "school-entry-creak",
        },
      ],
      ["Охранник", "Идите."],
      ["Дмит", "Да идём уже."],
      ["Вадим", "До свидания."],
      [
        "Охранник",
        "Надеюсь, нет.",
        {
          effects: [flag("SCHOOL_EXITED_WITH_GUARD")],
        },
      ],
    ],
    next: "main-exit-consequence-route",
  }),
  dialogue({
    id: "guard-side-exit",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Рассказчик",
        "Охранник проводит ребят к боковой двери и быстро открывает замок.",
        {
          ...setBackground("school-backyard-night"),
          sound: "school-entry-creak",
        },
      ],
      ["Охранник", "Вышли и не стойте возле школы."],
      ["Дмит", "А там что?"],
      ["Охранник", "Я ясно сказал?"],
      ["Вадим", "Вполне."],
      [
        "Рассказчик",
        "Дверь захлопывается за их спинами.",
        {
          effects: [
            flag("SCHOOL_EXITED_WITH_GUARD"),
            flag("SCHOOL_EXITED_THROUGH_BACKYARD"),
          ],
        },
      ],
    ],
    next: "dark-exit-consequence-route",
  }),
  /*
   * ВЕТКА: ДМИТ ВЕРНУЛСЯ ЗА ВАДИМОМ
   */
  dialogue({
    id: "exit-returned-vadim",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Рассказчик",
        "Дмит и Вадим выходят из кабинета информатики. Снизу доносятся шаги охранника.",
        {
          ...setBackground("school-second-floor-night"),
        },
      ],
      ["Вадим", "Ты мог оставить меня у него."],
      ["Дмит", "Мог."],
      ["Вадим", "Но вернулся."],
      ["Дмит", "Не начинай."],
      ["Вадим", "Я просто фиксирую факт."],
      ["Дмит", "Фиксируй потише."],
    ],
    next: "exit-phone-alert-route",
  }),
  /*
   * ВЕТКА: ДМИТ И ВАДИМ НЕ РАЗДЕЛЯЛИСЬ
   */
  dialogue({
    id: "exit-together-start",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Рассказчик",
        "Дмит и Вадим выходят из кабинета информатики. Рюкзак найден, но путь назад всё ещё перекрыт охранником.",
        {
          ...setBackground("school-second-floor-night"),
        },
      ],
      ["Вадим", "Теперь нужно выбраться."],
      ["Дмит", "Самая простая часть."],
      ["Вадим", "Ты говорил это перед тем, как нас заметили."],
      ["Дмит", "Теперь у меня больше опыта."],
      ["Вадим", "И меньше времени."],
    ],
    next: "exit-phone-alert-route",
  }),
  /*
   * ВЕТКА: ДМИТ ОСТАЛСЯ ОДИН
   */
  dialogue({
    id: "exit-alone-start",
    cast: ["Дмит"],
    lines: [
      [
        "Рассказчик",
        "Дмит выходит из кабинета один. Рюкзак Вадима висит у него на плече.",
        {
          ...setBackground("school-second-floor-night"),
        },
      ],
      [
        "Рассказчик",
        "Снизу больше не слышно голоса Вадима. Только шаги охранника и скрип дверей.",
      ],
      ["Дмит", "Бля…"],
    ],
    next: "mishgan-abandonment-chat",
  }),
  dialogue({
    id: "mishgan-abandonment-chat",
    cast: ["Дмит", "Мишган"],
    lines: [
      [
        "Мишган",
        "Где Вадим?",
        {
          phoneMessage: {
            contact: "Мишган",
            direction: "incoming",
            time: "22:47",
          },
        },
      ],
      [
        "Дмит",
        "У охранника.",
        {
          phoneMessage: {
            contact: "Мишган",
            direction: "outgoing",
            time: "22:47",
          },
        },
      ],
      [
        "Мишган",
        "А ты где?",
        {
          phoneMessage: {
            contact: "Мишган",
            direction: "incoming",
            time: "22:47",
          },
        },
      ],
      [
        "Дмит",
        "На втором этаже. Рюкзак забрал.",
        {
          phoneMessage: {
            contact: "Мишган",
            direction: "outgoing",
            time: "22:47",
          },
        },
      ],
      [
        "Мишган",
        "Ты опять человека бросил?",
        {
          phoneMessage: {
            contact: "Мишган",
            direction: "incoming",
            time: "22:47",
          },
        },
      ],
      [
        "Дмит",
        "Я потом за ним вернусь.",
        {
          phoneMessage: {
            contact: "Мишган",
            direction: "outgoing",
            time: "22:47",
          },
        },
      ],
      [
        "Мишган",
        "Уф-уф. Я это уже слышал.",
        {
          phoneMessage: {
            contact: "Мишган",
            direction: "incoming",
            time: "22:47",
          },
        },
      ],
    ],
    next: "exit-phone-alert-route",
  }),
  /*
   * СООБЩЕНИЕ С ЧЁРНОГО ТЕЛЕФОНА
   */
  route({
    id: "exit-phone-alert-route",
    routes: [["MAFIA_CONTACT_ALERTED", "exit-alert-holder-route"]],
    fallback: "exit-party-route",
  }),
  route({
    id: "exit-alert-holder-route",
    routes: [
      ["BLACK_PHONE_DESTROYED", "exit-party-route"],
      ["BLACK_PHONE_CONFISCATED", "exit-party-route"],
      ["BLACK_PHONE_LEFT_AT_SCHOOL", "exit-party-route"],
      ["DMIT_HAS_BLACK_PHONE", "black-phone-warning-dmit"],
    ],
    fallback: "exit-party-route",
  }),
  dialogue({
    id: "black-phone-warning-dmit",
    cast: ["Дмит"],
    lines: [
      [
        "Неизвестный номер",
        "Не выходи через главный вход.",
        {
          sound: "black-phone-vibration",
          phoneMessage: {
            contact: "Неизвестный номер",
            direction: "incoming",
            time: "22:48",
          },
        },
      ],
      [
        "Дмит",
        "Ты кто?",
        {
          phoneMessage: {
            contact: "Неизвестный номер",
            direction: "outgoing",
            time: "22:48",
          },
        },
      ],
      [
        "Неизвестный номер",
        "У тебя две минуты.",
        {
          effects: [flag("BLACK_PHONE_WARNED_ABOUT_MAIN_EXIT")],
          phoneMessage: {
            contact: "Неизвестный номер",
            direction: "incoming",
            time: "22:48",
          },
        },
      ],
    ],
    next: "exit-party-route",
  }),
  route({
    id: "exit-party-route",
    routes: [
      ["DMIT_RETURNED_FOR_VADIM", "exit-junction-together"],
      ["DMIT_DOUBLE_ABANDONMENT", "exit-junction-alone"],
      ["DMIT_ABANDONED_VADIM", "exit-junction-alone"],
    ],
    fallback: "exit-junction-together",
  }),
  /*
   * ГЛАВНЫЙ ВЫБОР ПУТИ
   */
  dialogue({
    id: "exit-junction-together",
    cast: ["Дмит", "Вадим"],
    tone: "danger",
    lines: [
      ["Рассказчик", "У лестничной площадки коридор разделяется надвое."],
      [
        "Рассказчик",
        "Слева слышны звон ключей, тяжёлые шаги и раздражённое бормотание охранника.",
      ],
      [
        "Рассказчик",
        "Справа не горит ни одна лампа. Коридор полностью растворяется в темноте.",
      ],
      ["Вадим", "Слева охранник."],
      ["Дмит", "Спасибо, я по звуку понял."],
      ["Вадим", "Справа должна быть старая пожарная лестница."],
      ["Дмит", "Должна быть?"],
      ["Вадим", "Я не пользовался ей ночью."],
    ],
    next: "exit-junction-together-choice",
  }),
  choice({
    id: "exit-junction-together-choice",
    cast: ["Дмит", "Вадим"],
    tone: "danger",
    prompt: "Какой путь выбрать?",
    options: [
      {
        text: "Пойти на шум и попробовать договориться с охранником.",
        next: "noise-route-together",
        effects: [flag("SCHOOL_EXIT_PATH_NOISE")],
      },
      {
        text: "Пойти в тёмный коридор.",
        next: "dark-route-together",
        effects: [flag("SCHOOL_EXIT_PATH_DARK")],
      },
      {
        text: "Подождать и прислушаться.",
        next: "junction-listen-together",
      },
    ],
  }),
  dialogue({
    id: "junction-listen-together",
    cast: ["Дмит", "Вадим"],
    tone: "danger",
    lines: [
      ["Рассказчик", "Ребята замирают. Шаги слева становятся громче."],
      [
        "Охранник",
        "Я знаю, что вы наверху!",
        {
          cast: ["Дмит", "Охранник"],
        },
      ],
      ["Вадим", "Теперь у нас меньше времени."],
      ["Дмит", "Зато точно знаем, где он."],
    ],
    next: "exit-junction-together-choice",
  }),
  dialogue({
    id: "exit-junction-alone",
    cast: ["Дмит"],
    tone: "danger",
    lines: [
      [
        "Рассказчик",
        "У лестничной площадки Дмит останавливается перед развилкой.",
      ],
      [
        "Рассказчик",
        "Слева слышны ключи и шаги охранника. Возможно, там же остался Вадим.",
      ],
      [
        "Рассказчик",
        "Справа начинается совершенно тёмный коридор, ведущий к старой пожарной лестнице.",
      ],
      ["Дмит", "Направо — не видно нихуя. Налево — охранник. Отлично."],
    ],
    next: "exit-junction-alone-choice",
  }),
  choice({
    id: "exit-junction-alone-choice",
    cast: ["Дмит"],
    tone: "danger",
    prompt: "Какой путь выбрать?",
    options: [
      {
        text: "Пойти на шум и вернуться к охраннику.",
        next: "noise-route-alone",
        effects: [flag("SCHOOL_EXIT_PATH_NOISE")],
      },
      {
        text: "Пойти в тёмный коридор и выбраться одному.",
        next: "dark-route-alone",
        effects: [flag("SCHOOL_EXIT_PATH_DARK")],
      },
      {
        text: "Крикнуть Вадиму.",
        next: "dmit-calls-vadim",
      },
    ],
  }),
  dialogue({
    id: "dmit-calls-vadim",
    cast: ["Дмит"],
    tone: "danger",
    lines: [
      ["Дмит", "Вадим!"],
      ["Рассказчик", "Из левой части коридора доносится голос охранника."],
      ["Охранник", "СЮДА ИДИ, ГЕРОЙ!"],
      ["Дмит", "Бля."],
    ],
    next: "exit-junction-alone-choice",
  }),
  /*
   * ПУТЬ НА ШУМ — ДМИТ И ВАДИМ
   */
  dialogue({
    id: "noise-route-together",
    cast: ["Дмит", "Вадим"],
    tone: "danger",
    lines: [
      [
        "Рассказчик",
        "Дмит и Вадим выходят навстречу шуму. Луч фонарика сразу бьёт им в лица.",
        {
          ...setBackground("school-corridor-night"),
        },
      ],
      ["Охранник", "Вот вы где!"],
      ["Дмит", "Мы сами к вам идём."],
      ["Охранник", "Это должно меня обрадовать?"],
    ],
    next: "noise-route-together-choice",
  }),
  choice({
    id: "noise-route-together-choice",
    cast: ["Дмит", "Охранник"],
    prompt: "Как объясниться с охранником?",
    options: [
      {
        text: "Сказать правду про рюкзак и олимпиаду.",
        check: skill("Харизма", 3),
        next: "noise-truth-success",
        failNext: "noise-talk-fail",
      },
      {
        text: "Сказать, что путь назад оказался закрыт.",
        check: skill("Интеллект", 2),
        next: "noise-practical-success",
        failNext: "noise-talk-fail",
      },
      {
        text: "Молча отдать охраннику рюкзак и сдаться.",
        next: "noise-surrender-together",
      },
      {
        text: "Мы уже уходим. Просто покажите выход.",
        next: "noise-direct-together",
      },
    ],
  }),
  dialogue({
    id: "noise-truth-success",
    cast: ["Дмит", "Охранник"],
    lines: [
      [
        "Дмит",
        "Рюкзак забрали. Там документы на олимпиаду. Больше нам ничего не надо.",
      ],
      [
        "Вадим",
        "Утром я должен передать их учителю.",
        {
          cast: ["Вадим", "Охранник"],
        },
      ],
      ["Охранник", "И ради этого вы устроили погоню по школе?"],
      ["Дмит", "Если так говорить, звучит хуёво."],
      ["Охранник", "Потому что это хуёво."],
      ["Дмит", "Но документы у него. Давайте просто выйдем."],
      ["Рассказчик", "Охранник тяжело вздыхает и опускает фонарик."],
      [
        "Охранник",
        "Вниз. Оба.",
        {
          effects: [
            flag("GUARD_ACCEPTED_BACKPACK_EXPLANATION"),
            relation("Вадим", 1),
          ],
        },
      ],
    ],
    next: "guard-main-exit",
  }),
  dialogue({
    id: "noise-practical-success",
    cast: ["Дмит", "Охранник"],
    lines: [
      ["Дмит", "Путь назад перекрыт. Мы можем дальше бегать и ломать двери."],
      ["Охранник", "Это угроза?"],
      [
        "Дмит",
        "Нет. Я предлагаю самый простой вариант: вы открываете выход, мы уходим.",
      ],
      [
        "Вадим",
        "Это действительно сократит ущерб.",
        {
          cast: ["Вадим", "Охранник"],
        },
      ],
      ["Охранник", "Умные нашлись."],
      ["Дмит", "Один умный. Я просто рядом."],
      [
        "Охранник",
        "Ладно. Вниз.",
        {
          effects: [flag("GUARD_CHOSE_SIMPLE_EXIT")],
        },
      ],
    ],
    next: "guard-main-exit",
  }),
  dialogue({
    id: "noise-talk-fail",
    cast: ["Дмит", "Охранник"],
    lines: [
      ["Дмит", "Мы просто хотели спокойно выйти."],
      ["Охранник", "Спокойно? После того, что вы устроили?"],
      ["Дмит", "Ну уже устроили. Назад не вернёшь."],
      ["Охранник", "Телефоны и рюкзак на стол. Потом звонок родителям."],
      [
        "Вадим",
        "Можно сначала выйти?",
        {
          cast: ["Вадим", "Охранник"],
        },
      ],
      [
        "Охранник",
        "Выйдете. Со мной.",
        {
          effects: [flag("GUARD_RECORDED_STUDENT_NAMES")],
        },
      ],
    ],
    next: "guard-main-exit",
  }),
  dialogue({
    id: "noise-surrender-together",
    cast: ["Дмит", "Охранник"],
    lines: [
      [
        "Рассказчик",
        "Дмит снимает рюкзак с плеча и протягивает его охраннику.",
      ],
      ["Дмит", "На. Только не забирайте документы."],
      ["Охранник", "Вниз пошли. Там разберёмся."],
      [
        "Вадим",
        "Рюкзак мой.",
        {
          cast: ["Вадим", "Охранник"],
        },
      ],
      [
        "Охранник",
        "Значит, понесёшь сам. Но пойдёшь передо мной.",
        {
          effects: [flag("SCHOOL_EXIT_SURRENDERED")],
        },
      ],
    ],
    next: "guard-main-exit",
  }),
  dialogue({
    id: "noise-direct-together",
    cast: ["Дмит", "Охранник"],
    lines: [
      ["Дмит", "Мы уже уходим. Просто покажите выход."],
      ["Охранник", "Главный выход находится там же, где был всегда."],
      ["Дмит", "Там, где вы за нами бегали?"],
      ["Охранник", "Да."],
      ["Дмит", "Тогда идём вместе."],
      ["Охранник", "Я это и собирался сделать."],
    ],
    next: "guard-main-exit",
  }),
  /*
   * ПУТЬ НА ШУМ — ДМИТ ОДИН
   */
  dialogue({
    id: "noise-route-alone",
    cast: ["Дмит", "Охранник"],
    tone: "danger",
    lines: [
      [
        "Рассказчик",
        "Дмит идёт навстречу шагам. Охранник появляется из-за угла и направляет на него фонарик.",
        {
          ...setBackground("school-corridor-night"),
        },
      ],
      ["Охранник", "Набегался?"],
      ["Дмит", "Типа того."],
      ["Охранник", "А второй где?"],
      ["Дмит", "У вас был."],
      ["Охранник", "Я про того мелкого и спрашиваю."],
    ],
    next: "noise-route-alone-choice",
  }),
  choice({
    id: "noise-route-alone-choice",
    cast: ["Дмит", "Охранник"],
    prompt: "Что ответить про Вадима?",
    options: [
      {
        text: "Я вернулся за ним.",
        check: skill("Харизма", 3),
        next: "alone-returns-for-vadim",
        failNext: "alone-guard-catches",
      },
      {
        text: "Сначала выведите меня, потом найдём его.",
        check: skill("Интеллект", 2),
        next: "alone-practical-guard",
        failNext: "alone-guard-catches",
      },
      {
        text: "Он сам разберётся.",
        next: "alone-confirms-abandonment",
      },
      {
        text: "Молча отдать рюкзак.",
        next: "alone-guard-catches",
      },
    ],
  }),
  dialogue({
    id: "alone-returns-for-vadim",
    cast: ["Дмит", "Охранник"],
    lines: [
      ["Дмит", "Я за ним вернулся. Где он?"],
      ["Охранник", "На вахте сидит."],
      ["Дмит", "Тогда ведите."],
      ["Охранник", "Решил совесть найти?"],
      [
        "Дмит",
        "Нашёл уже. Теперь Вадима найти надо.",
        {
          effects: [
            flag("DMIT_RETURNED_FOR_VADIM_SECOND_TIME"),
            relation("Вадим", 1),
          ],
        },
      ],
    ],
    next: "guard-main-exit",
  }),
  dialogue({
    id: "alone-practical-guard",
    cast: ["Дмит", "Охранник"],
    lines: [
      ["Дмит", "Если он сбежал, мы вдвоём быстрее его найдём."],
      ["Охранник", "Ты меня ещё учить будешь?"],
      ["Дмит", "Нет. Просто предлагаю не стоять."],
      [
        "Охранник",
        "Вниз. Рюкзак неси.",
        {
          effects: [flag("DMIT_EXITED_WITH_GUARD_ALONE")],
        },
      ],
    ],
    next: "guard-main-exit",
  }),
  dialogue({
    id: "alone-confirms-abandonment",
    cast: ["Дмит", "Охранник"],
    lines: [
      ["Дмит", "Он сам разберётся."],
      ["Охранник", "А рюкзак его у тебя?"],
      ["Дмит", "Ну да."],
      ["Охранник", "Хороший ты друг."],
      ["Дмит", "Без лекций давайте."],
      [
        "Охранник",
        "Вниз пошёл.",
        {
          effects: [flag("DMIT_CONFIRMED_ABANDONMENT"), relation("Вадим", -1)],
        },
      ],
    ],
    next: "guard-main-exit",
  }),
  dialogue({
    id: "alone-guard-catches",
    cast: ["Дмит", "Охранник"],
    lines: [
      ["Охранник", "Хватит мне зубы заговаривать."],
      [
        "Рассказчик",
        "Охранник забирает рюкзак и указывает фонариком в сторону лестницы.",
      ],
      ["Охранник", "Вниз. Медленно."],
      [
        "Дмит",
        "Да иду я.",
        {
          effects: [flag("DMIT_CAUGHT_DURING_EXIT")],
        },
      ],
    ],
    next: "guard-main-exit",
  }),
  /*
   * ТЁМНЫЙ ПУТЬ — ДМИТ И ВАДИМ
   */
  dialogue({
    id: "dark-route-together",
    cast: ["Дмит", "Вадим"],
    tone: "danger",
    lines: [
      [
        "Рассказчик",
        "Дмит и Вадим сворачивают в тёмный коридор. Через несколько шагов свет с лестничной площадки остаётся позади.",
      ],
      ["Дмит", "Не видно вообще ничего."],
      ["Вадим", "Не отходи от стены."],
      ["Дмит", "Ты где?"],
      ["Вадим", "Рядом."],
      ["Дмит", "Тогда не дыши мне в ухо."],
      ["Вадим", "Это не я."],
      ["Дмит", "Бля."],
    ],
    next: "dark-route-together-choice",
  }),
  choice({
    id: "dark-route-together-choice",
    cast: ["Дмит", "Вадим"],
    tone: "danger",
    prompt: "Как пройти тёмный коридор?",
    options: [
      {
        text: "Искать аварийные указатели и сквозняк.",
        check: skill("Внимательность", 2),
        next: "dark-perception-success",
        failNext: "dark-route-noisy",
      },
      {
        text: "Быстро пройти вдоль стены.",
        check: skill("Ловкость", 3),
        next: "dark-agility-success",
        failNext: "dark-route-noisy",
      },
      {
        text: "Попросить Вадима вести.",
        next: "dark-vadim-leads",
      },
      {
        text: "Идти вперёд на ощупь.",
        next: "dark-route-noisy",
      },
    ],
  }),
  dialogue({
    id: "dark-perception-success",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Рассказчик",
        "Дмит замечает слабый зелёный отблеск возле пола и чувствует холодный воздух.",
      ],
      ["Дмит", "Вон там что-то светится."],
      ["Вадим", "Указатель выхода."],
      ["Дмит", "Я сам понял."],
      ["Вадим", "Ты спросил взглядом."],
      ["Рассказчик", "За поворотом обнаруживается дверь пожарной лестницы."],
    ],
    next: "dark-fire-exit-together",
  }),
  dialogue({
    id: "dark-agility-success",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Рассказчик",
        "Дмит одной рукой ведёт по стене, другой держит Вадима за рукав.",
      ],
      ["Вадим", "Можно не тянуть меня так сильно."],
      ["Дмит", "Можно отстать и остаться здесь."],
      ["Вадим", "Продолжай тянуть."],
      [
        "Рассказчик",
        "Через несколько секунд они упираются в дверь пожарной лестницы.",
      ],
    ],
    next: "dark-fire-exit-together",
  }),
  dialogue({
    id: "dark-vadim-leads",
    cast: ["Дмит", "Вадим"],
    lines: [
      ["Дмит", "Ты школу лучше знаешь. Веди."],
      ["Вадим", "Только не отпускай плечо."],
      ["Дмит", "Я тебе не Данз."],
      ["Вадим", "Я не понимаю сравнение."],
      ["Дмит", "И хорошо."],
      [
        "Рассказчик",
        "Вадим медленно проводит Дмита вдоль стены и находит дверь пожарной лестницы.",
        {
          effects: [relation("Вадим", 1)],
        },
      ],
    ],
    next: "dark-fire-exit-together",
  }),
  dialogue({
    id: "dark-route-noisy",
    cast: ["Дмит", "Вадим"],
    tone: "danger",
    lines: [
      [
        "Рассказчик",
        "Дмит задевает металлический шкаф. По коридору прокатывается громкий грохот.",
      ],
      ["Охранник издалека", "СТОЯТЬ!"],
      ["Дмит", "Он ещё далеко."],
      ["Вадим", "Ты определил это по громкости?"],
      ["Дмит", "Нет. Я надеюсь."],
      [
        "Рассказчик",
        "Вадим находит ручку пожарной двери и дёргает её на себя.",
        {
          effects: [flag("GUARD_HEARD_DARK_EXIT")],
        },
      ],
    ],
    next: "dark-fire-exit-together",
  }),
  dialogue({
    id: "dark-fire-exit-together",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Рассказчик",
        "Пожарная лестница выводит ребят к тяжёлой двери на заднем дворе школы.",
        {
          ...setBackground("school-backyard-night"),
          sound: "school-entry-creak",
        },
      ],
      ["Вадим", "Она может быть заперта."],
      ["Дмит", "Тогда выбьем."],
      ["Вадим", "Подожди."],
      [
        "Рассказчик",
        "Вадим нажимает маленький рычаг возле замка. Дверь открывается.",
      ],
      ["Дмит", "Я тоже это видел."],
      ["Вадим", "Конечно."],
      [
        "Рассказчик",
        "Они выходят во двор и осторожно закрывают дверь за собой.",
        {
          effects: [flag("SCHOOL_EXITED_THROUGH_BACKYARD")],
        },
      ],
    ],
    next: "dark-exit-consequence-route",
  }),
  /*
   * ТЁМНЫЙ ПУТЬ — ДМИТ ОДИН
   */
  dialogue({
    id: "dark-route-alone",
    cast: ["Дмит"],
    tone: "danger",
    lines: [
      [
        "Рассказчик",
        "Дмит сворачивает в тёмный коридор. Через несколько шагов он перестаёт видеть даже собственные руки.",
      ],
      ["Дмит", "Нормально. Просто прямо."],
      [
        "Рассказчик",
        "Где-то впереди капает вода. Позади становятся громче шаги охранника.",
      ],
    ],
    next: "dark-route-alone-choice",
  }),
  choice({
    id: "dark-route-alone-choice",
    cast: ["Дмит"],
    tone: "danger",
    prompt: "Как найти выход в темноте?",
    options: [
      {
        text: "Искать зелёный свет и сквозняк.",
        check: skill("Внимательность", 3),
        next: "dark-alone-success",
        failNext: "dark-alone-fail",
      },
      {
        text: "Быстро двигаться вдоль стены.",
        check: skill("Ловкость", 3),
        next: "dark-alone-success",
        failNext: "dark-alone-fail",
      },
      {
        text: "Включить фонарик на телефоне.",
        next: "dark-alone-phone-light",
      },
      {
        text: "Идти на ощупь.",
        next: "dark-alone-fail",
      },
    ],
  }),
  dialogue({
    id: "dark-alone-success",
    cast: ["Дмит"],
    lines: [
      ["Рассказчик", "Дмит замечает слабое зелёное свечение возле двери."],
      ["Дмит", "Ага. Попался."],
      ["Рассказчик", "За дверью находится старая пожарная лестница."],
    ],
    next: "dark-fire-exit-alone",
  }),
  dialogue({
    id: "dark-alone-phone-light",
    cast: ["Дмит"],
    lines: [
      [
        "Рассказчик",
        "Дмит включает фонарик. Узкий луч освещает стену и зелёный указатель выхода.",
      ],
      ["Дмит", "Вот и вся ваша темнота."],
      [
        "Рассказчик",
        "В этот момент из-за поворота появляется свет фонаря охранника.",
      ],
      ["Охранник", "ВИЖУ ТЕБЯ!"],
      ["Дмит", "Бля."],
      [
        "Рассказчик",
        "Дмит бросается к пожарной двери.",
        {
          effects: [flag("GUARD_SAW_DMIT_PHONE_LIGHT")],
        },
      ],
    ],
    next: "dark-fire-exit-alone",
  }),
  dialogue({
    id: "dark-alone-fail",
    cast: ["Дмит"],
    tone: "danger",
    lines: [
      ["Рассказчик", "Дмит врезается коленом в низкий шкаф."],
      ["Дмит", "Сука!"],
      ["Охранник издалека", "ВОТ ТЫ ГДЕ!"],
      [
        "Рассказчик",
        "Дмит ощупывает стену и находит холодную металлическую ручку.",
      ],
      [
        "Дмит",
        "Давай, открывайся.",
        {
          effects: [flag("GUARD_HEARD_DARK_EXIT")],
        },
      ],
    ],
    next: "dark-fire-exit-alone",
  }),
  dialogue({
    id: "dark-fire-exit-alone",
    cast: ["Дмит"],
    lines: [
      [
        "Рассказчик",
        "Дмит спускается по пожарной лестнице и вываливается на задний двор школы.",
        {
          ...setBackground("school-backyard-night"),
          sound: "school-entry-creak",
        },
      ],
      ["Рассказчик", "За дверью уже слышны шаги охранника."],
      ["Дмит", "Поздно."],
      [
        "Рассказчик",
        "Он закрывает дверь снаружи и отходит к мусорным контейнерам.",
        {
          effects: [
            flag("SCHOOL_EXITED_THROUGH_BACKYARD"),
            flag("DMIT_ESCAPED_SCHOOL_ALONE"),
          ],
        },
      ],
    ],
    next: "dark-exit-consequence-route",
  }),
  /*
   * ПОСЛЕДСТВИЯ ВЫБОРА ВЫХОДА
   */
  route({
    id: "main-exit-consequence-route",
    routes: [
      ["MAFIA_CONTACT_ALERTED", "main-exit-unknown-car"],
      ["BUILDER_CAMP_CONNECTION_NOTICED", "outside-builder-talk"],
    ],
    fallback: "outside-normal",
  }),
  dialogue({
    id: "main-exit-unknown-car",
    cast: ["Дмит", "Вадим"],
    tone: "danger",
    lines: [
      [
        "Рассказчик",
        "На другой стороне дороги стоит чёрная машина с выключенными фарами.",
        {
          ...setBackground("school-main-entrance-night"),
        },
      ],
      ["Вадим", "Она была здесь раньше?"],
      ["Дмит", "Не помню."],
      [
        "Рассказчик",
        "В салоне загорается экран телефона. Машина медленно трогается с места.",
      ],
      ["Вадим", "Нам писали не выходить через главный вход."],
      [
        "Дмит",
        "Теперь понятно почему.",
        {
          effects: [flag("UNKNOWN_CAR_SAW_GROUP")],
        },
      ],
    ],
    next: "outside-friends",
  }),
  route({
    id: "dark-exit-consequence-route",
    routes: [
      ["MAFIA_CONTACT_ALERTED", "dark-exit-unknown-car"],
      ["BUILDER_CAMP_CONNECTION_NOTICED", "outside-builder-talk"],
    ],
    fallback: "outside-normal",
  }),
  dialogue({
    id: "dark-exit-unknown-car",
    cast: ["Дмит", "Вадим"],
    tone: "danger",
    lines: [
      [
        "Рассказчик",
        "Через щель между школьными корпусами видны фары машины возле главного входа.",
      ],
      ["Вадим", "Кажется, сообщение было настоящим предупреждением."],
      ["Дмит", "Или нас специально сюда направили."],
      ["Вадим", "Это менее приятный вариант."],
      [
        "Дмит",
        "Поэтому пошли быстрее.",
        {
          effects: [flag("UNKNOWN_CAR_DID_NOT_SEE_GROUP")],
        },
      ],
    ],
    next: "outside-friends",
  }),
  dialogue({
    id: "outside-builder-talk",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Рассказчик",
        "Ребята отходят от школы и только тогда замедляют шаг.",
        {
          ...setBackground("school-yard-night"),
        },
      ],
      ["Вадим", "В сообщениях упоминался «Строитель»."],
      ["Дмит", "Я летом еду в лагерь с таким названием."],
      ["Вадим", "Ты считаешь это совпадением?"],
      ["Дмит", "Пока да."],
      ["Вадим", "А потом?"],
      ["Дмит", "Потом постараюсь не думать."],
      ["Вадим", "Это не лучший способ решать проблемы."],
      [
        "Дмит",
        "Зато мой.",
        {
          effects: [flag("DMIT_DISCUSSSED_BUILDER_WITH_VADIM")],
        },
      ],
    ],
    next: "outside-friends",
  }),
  dialogue({
    id: "outside-normal",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Рассказчик",
        "Ребята отходят от школы. Ночной воздух после душных коридоров кажется особенно холодным.",
        {
          ...setBackground("school-yard-night"),
        },
      ],
      ["Вадим", "Мы выбрались."],
      ["Дмит", "Я же говорил."],
      ["Вадим", "Ты несколько раз говорил обратное."],
      ["Дмит", "Главное — последняя версия."],
    ],
    next: "outside-friends",
  }),
  /*
   * ВСТРЕЧА С ОСТАЛЬНОЙ КОМПАНИЕЙ
   */
  route({
    id: "outside-friends",
    routes: [
      ["DMIT_RETURNED_FOR_VADIM", "outside-friends-returned"],
      ["DMIT_DOUBLE_ABANDONMENT", "outside-friends-alone"],
      ["DMIT_ABANDONED_VADIM", "outside-friends-alone"],
    ],
    fallback: "outside-friends-together",
  }),
  dialogue({
    id: "outside-friends-returned",
    cast: ["Дмит", "Мишган"],
    lines: [
      [
        "Рассказчик",
        "За школьным забором ждут Кед, Данз и Мишган.",
        {
          ...setBackground("school-yard-night"),
        },
      ],
      ["Мишган", "Уф-уф, бля! Оба вышли!"],
      ["Кед", "Рюкзак забрали?"],
      [
        "Вадим",
        "Да.",
        {
          cast: ["Вадим", "Кед"],
        },
      ],
      ["Данз", "А компьютеры не вынесли?"],
      ["Дмит", "Нет."],
      ["Данз", "Зря ходили."],
      ["Кед", "Данз, заткнись."],
      ["Мишган", "Дмит обратно за ним вернулся?"],
      ["Вадим", "Вернулся."],
      ["Мишган", "Обновление работает."],
      [
        "Дмит",
        "Сейчас удалю тебя нахуй.",
        {
          effects: [relation("Мишган", 1), relation("Вадим", 1)],
        },
      ],
    ],
    next: "school-exit-finish",
  }),
  dialogue({
    id: "outside-friends-together",
    cast: ["Дмит", "Кед"],
    lines: [
      [
        "Рассказчик",
        "Возле забора ребят встречают Кед, Данз и Мишган.",
        {
          ...setBackground("school-yard-night"),
        },
      ],
      ["Кед", "Наконец-то."],
      ["Данз", "Мы уже думали, вас там в пионеры приняли."],
      ["Мишган", "Рюкзак у вас?"],
      [
        "Вадим",
        "У нас.",
        {
          cast: ["Вадим", "Мишган"],
        },
      ],
      ["Дмит", "Значит, всё нормально."],
      ["Вадим", "Я бы не использовал слово «нормально»."],
      ["Дмит", "Зато закончилось."],
    ],
    next: "school-exit-finish",
  }),
  dialogue({
    id: "outside-friends-alone",
    cast: ["Дмит", "Кед"],
    lines: [
      [
        "Рассказчик",
        "Дмит выходит к остальным один. Рюкзак Вадима остаётся у него на плече.",
        {
          ...setBackground("school-yard-night"),
        },
      ],
      ["Кед", "А Вадим?"],
      ["Дмит", "Охранник его поймал."],
      [
        "Мишган",
        "А ты ушёл?",
        {
          cast: ["Дмит", "Мишган"],
        },
      ],
      ["Дмит", "Я рюкзак забрал."],
      ["Мишган", "Я не про рюкзак спрашивал."],
      [
        "Данз",
        "Может, его сейчас отпустят.",
        {
          cast: ["Кед", "Данз"],
        },
      ],
      ["Кед", "А может, родителям позвонят."],
      ["Дмит", "Утром разберёмся."],
      [
        "Мишган",
        "Нет, Дмит. Это ты утром разберёшься.",
        {
          effects: [
            relation("Мишган", -2),
            relation("Кед", -1),
            flag("FRIENDS_KNOW_DMIT_ABANDONED_VADIM"),
          ],
        },
      ],
    ],
    next: "school-exit-finish",
  }),
  /*
   * ЗАВЕРШЕНИЕ ЭТАПА
   */
  route({
    id: "school-exit-finish",
    routes: [
      ["DMIT_DOUBLE_ABANDONMENT", "school-exit-bad-ending"],
      ["BLACK_PHONE_DESTROYED", "school-exit-standard-ending"],
      ["BLACK_PHONE_CONFISCATED", "school-exit-standard-ending"],
      ["BLACK_PHONE_LEFT_AT_SCHOOL", "school-exit-standard-ending"],
      ["DMIT_HAS_BLACK_PHONE", "school-exit-phone-ending"],
    ],
    fallback: "school-exit-standard-ending",
  }),
  dialogue({
    id: "school-exit-standard-ending",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Рассказчик",
        "Компания покидает территорию школы. Позади остаются тёмные окна, разозлённый охранник и открытая утром дверь кабинета информатики.",
      ],
      [
        "Рассказчик",
        "Рюкзак Вадима найден. Но ночные события ещё обязательно напомнят о себе.",
        {
          effects: [flag("SCHOOL_EXIT_STAGE_COMPLETE")],
        },
      ],
    ],
    next: "small-school-quest-finish",
  }),
  dialogue({
    id: "school-exit-phone-ending",
    cast: ["Дмит", "Вадим"],
    lines: [
      [
        "Рассказчик",
        "Компания отходит от школы. Чёрный телефон снова коротко вибрирует.",
        {
          sound: "black-phone-vibration",
        },
      ],
      ["Дмит", "Только не открывай пока."],
      ["Вадим", "Почему?"],
      ["Дмит", "Потому что я сегодня уже достаточно узнал."],
      ["Вадим", "Это не значит, что сообщения исчезнут."],
      [
        "Дмит",
        "Зато хотя бы пять минут будет тихо.",
        {
          effects: [
            flag("SCHOOL_EXIT_STAGE_COMPLETE"),
            flag("BLACK_PHONE_LEFT_SCHOOL"),
          ],
        },
      ],
    ],
    next: "small-school-quest-finish",
  }),
  dialogue({
    id: "school-exit-bad-ending",
    cast: ["Дмит", "Мишган"],
    lines: [
      [
        "Рассказчик",
        "Компания уходит от школы без Вадима. Никто не шутит, даже Данз.",
      ],
      ["Мишган", "Утром ты к нему пойдёшь."],
      ["Дмит", "Посмотрим."],
      ["Мишган", "Нет. Пойдёшь."],
      ["Дмит", "Ладно."],
      [
        "Рассказчик",
        "Дмит отвечает слишком быстро. Даже он сам пока не знает, выполнит ли обещание.",
        {
          effects: [
            flag("SCHOOL_EXIT_STAGE_COMPLETE"),
            flag("VADIM_REMAINS_WITH_GUARD"),
          ],
        },
      ],
    ],
    next: "small-school-quest-finish",
  }),
];
