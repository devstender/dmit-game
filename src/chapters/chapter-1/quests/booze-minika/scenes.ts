import type { Scene, StoryChoice } from "../../../../types/story";
import {
  returnHomeQuestScenes,
  returnHomeQuestStartScene,
} from "../return-home/scenes";

export const boozeMinikaQuestStartScene =
  returnHomeQuestStartScene + returnHomeQuestScenes.length;

type DraftChoice = Omit<StoryChoice, "next" | "failNext"> & {
  next: string;
  failNext?: string;
};
type DraftRoute = { flag: string; next: string };
type DraftScene = Omit<
  Scene,
  "next" | "nextByFlag" | "fallbackNext" | "choices"
> & {
  id?: string;
  next?: string;
  nextByFlag?: DraftRoute[];
  fallbackNext?: string;
  choices?: DraftChoice[];
};

const inferSceneSound = (id?: string): Scene["sound"] => {
  if (id === "matvey-1") return "matvey-music";
  return undefined;
};

const buildScenes = (startIndex: number, drafts: DraftScene[]): Scene[] => {
  const labels = new Map<string, number>();
  drafts.forEach((draft, index) => {
    if (draft.id) labels.set(draft.id, startIndex + index);
  });

  drafts.forEach((draft, index) => {
    if (draft.id || index === 0) return;
    const previousNext = drafts[index - 1].next;
    if (previousNext && !labels.has(previousNext)) {
      labels.set(previousNext, startIndex + index);
    }
  });

  const resolve = (label?: string) =>
    label === undefined ? undefined : labels.get(label);

  return drafts.map(
    ({ id: _id, next, nextByFlag, fallbackNext, choices, ...scene }) => ({
      ...scene,
      sound: scene.sound ?? inferSceneSound(_id),
      next: resolve(next),
      nextByFlag: nextByFlag?.map((route) => ({
        flag: route.flag,
        next: resolve(route.next) ?? startIndex,
      })),
      fallbackNext: resolve(fallbackNext),
      choices: choices?.map((choice) => ({
        ...choice,
        next: resolve(choice.next) ?? startIndex,
        failNext: resolve(choice.failNext),
      })),
    }),
  );
};

const line = (
  speaker: Scene["speaker"],
  text: string,
  next: string,
  left: Scene["left"] = "Дмит",
  right?: Scene["right"],
  extra: Partial<DraftScene> = {},
): DraftScene => ({
  speaker,
  text,
  left,
  right,
  background: "minika",
  next,
  ...extra,
});

export const boozeMinikaQuestScenes: Scene[] = buildScenes(
  boozeMinikaQuestStartScene,
  [
    line(
      "Рассказчик",
      "Восемь вечера. Минька — маленькая площадка между гаражами, детским садом и домом, из окон которого взрослые постоянно грозятся вызвать милицию.",
      "start-2",
      "Дмит",
      "Кед",
      { id: "start-1" },
    ),
    line(
      "Рассказчик",
      "Кед уже сидит на лавке. Рядом лежит пакет с едой. Данз ходит вокруг и что-то увлечённо печатает в телефоне.",
      "start-3",
      "Дмит",
      "Кед",
      { id: "start-2" },
    ),
    line("Кед", "О, Дмит идёт.", "start-4", "Дмит", "Кед", { id: "start-3" }),
    line(
      "Данз",
      "Наконец-то. Я уже думал, его мама не отпустила.",
      "start-5",
      "Дмит",
      "Данз",
      { id: "start-4" },
    ),
    line("Дмит", "Сам ты не отпустила.", "start-6", "Дмит", "Данз", {
      id: "start-5",
    }),
    line(
      "Кед",
      "Не ругайтесь. Мы ещё даже не начали.",
      "start-7",
      "Дмит",
      "Кед",
      { id: "start-6" },
    ),
    line("Дмит", "А чё у тебя в пакете?", "start-8", "Дмит", "Кед", {
      id: "start-7",
    }),
    line("Кед", "Хлеб, колбаса, сыр и гречка.", "start-9", "Дмит", "Кед", {
      id: "start-8",
    }),
    line("Дмит", "Ты гречку на улицу притащил?", "start-10", "Дмит", "Кед", {
      id: "start-9",
    }),
    line("Кед", "Она в контейнере.", "start-11", "Дмит", "Кед", {
      id: "start-10",
    }),
    line("Данз", "Романтический ужин качка.", "start-12", "Дмит", "Данз", {
      id: "start-11",
    }),
    line(
      "Кед",
      "Ещё одна шутка — будешь есть контейнер.",
      "start-13",
      "Дмит",
      "Кед",
      { id: "start-12" },
    ),
    line("Данз", "С гречкой?", "alcohol-route", "Дмит", "Данз", {
      id: "start-13",
    }),
    {
      id: "alcohol-route",
      speaker: "Кед",
      text: "Без.",
      left: "Дмит",
      right: "Кед",
      background: "minika",
      nextByFlag: [
        {
          flag: "CHAPTER_1_ALCOHOL_HEAVY",
          next: "heavy-1",
        },
        {
          flag: "CHAPTER_1_ALCOHOL_BEER",
          next: "beer-1",
        },
        {
          flag: "CHAPTER_1_ALCOHOL_SOBER",
          next: "sober-1",
        },
      ],
      fallbackNext: "sober-1",
    },

    line(
      "Рассказчик",
      "Дмит ставит на лавку пакет. Внутри звякают бутылки пива и небольшая бутылка водки.",
      "heavy-2",
      "Дмит",
      "Кед",
      { id: "heavy-1" },
    ),
    line("Кед", "Ты реально водку взял?", "heavy-3", "Дмит", "Кед", {
      id: "heavy-2",
    }),
    line("Дмит", "Ну да.", "heavy-4", "Дмит", "Кед", { id: "heavy-3" }),
    line("Кед", "И пиво?", "heavy-5", "Дмит", "Кед", { id: "heavy-4" }),
    line("Дмит", "Ну да.", "heavy-6", "Дмит", "Кед", { id: "heavy-5" }),
    line("Кед", "Плохая комбинация.", "heavy-7", "Дмит", "Кед", {
      id: "heavy-6",
    }),
    line("Данз", "Зато быстрая.", "heavy-8", "Дмит", "Данз", { id: "heavy-7" }),
    line("Дмит", "Не ссыте. По чуть-чуть.", "heavy-9", "Дмит", "Данз", {
      id: "heavy-8",
    }),
    line(
      "Кед",
      "Все большие ошибки начинаются со слов «по чуть-чуть».",
      "heavy-10",
      "Дмит",
      "Кед",
      { id: "heavy-9" },
    ),
    line("Данз", "И все великие отношения.", "heavy-11", "Дмит", "Данз", {
      id: "heavy-10",
    }),
    line(
      "Кед",
      "Ты про отношения знаешь только из САМПа.",
      "heavy-12",
      "Дмит",
      "Кед",
      { id: "heavy-11" },
    ),
    line(
      "Данз",
      "Там они хотя бы сохраняются после выхода.",
      "heavy-13",
      "Дмит",
      "Данз",
      { id: "heavy-12" },
    ),
    line("Дмит", "Стаканы есть?", "heavy-14", "Дмит", "Данз", {
      id: "heavy-13",
    }),
    line("Кед", "Есть.", "heavy-15", "Дмит", "Кед", { id: "heavy-14" }),
    line("Данз", "У меня один из дома.", "heavy-16", "Дмит", "Данз", {
      id: "heavy-15",
    }),
    line("Кед", "Почему на нём цветочки?", "heavy-17", "Дмит", "Кед", {
      id: "heavy-16",
    }),
    line("Данз", "Бабушкин.", "heavy-18", "Дмит", "Данз", { id: "heavy-17" }),
    line("Дмит", "Ты у бабушки стакан спиздил?", "heavy-19", "Дмит", "Данз", {
      id: "heavy-18",
    }),
    line(
      "Данз",
      "Одолжил для культурного мероприятия.",
      "first-talk-1",
      "Дмит",
      "Данз",
      { id: "heavy-19", effects: { flags: ["CHAPTER_1_ALCOHOL_HEAVY"] } },
    ),

    line(
      "Рассказчик",
      "Дмит достаёт из пакета несколько банок «Охоты Крепкой».",
      "beer-2",
      "Дмит",
      "Кед",
      { id: "beer-1" },
    ),
    line("Кед", "Вот это другое дело.", "beer-3", "Дмит", "Кед", {
      id: "beer-2",
    }),
    line("Данз", "Мужской компот.", "beer-4", "Дмит", "Данз", { id: "beer-3" }),
    line("Дмит", "Только не выжирайте сразу.", "beer-5", "Дмит", "Данз", {
      id: "beer-4",
    }),
    line("Кед", "Мы спортсмены. У нас режим.", "beer-6", "Дмит", "Кед", {
      id: "beer-5",
    }),
    line(
      "Дмит",
      "Ты спортсмен. Данз в компьютер сидит.",
      "beer-7",
      "Дмит",
      "Кед",
      { id: "beer-6" },
    ),
    line("Данз", "У меня пальцы спортивные.", "beer-8", "Дмит", "Данз", {
      id: "beer-7",
    }),
    line("Кед", "Не рассказывай почему.", "beer-9", "Дмит", "Кед", {
      id: "beer-8",
    }),
    line("Данз", "Я про САМП говорил.", "beer-10", "Дмит", "Данз", {
      id: "beer-9",
    }),
    line("Дмит", "Конечно.", "beer-11", "Дмит", "Данз", { id: "beer-10" }),
    line(
      "Рассказчик",
      "Банки открываются почти одновременно.",
      "beer-12",
      "Дмит",
      "Данз",
      { id: "beer-11", sound: "beer-open" },
    ),
    line("Кед", "За лето.", "beer-13", "Дмит", "Кед", { id: "beer-12" }),
    line("Данз", "За девушек в лагере.", "beer-14", "Дмит", "Данз", {
      id: "beer-13",
    }),
    line(
      "Дмит",
      "За то, чтобы тебя туда не пустили.",
      "first-talk-1",
      "Дмит",
      "Данз",
      { id: "beer-14", effects: { flags: ["CHAPTER_1_ALCOHOL_BEER"] } },
    ),

    line(
      "Рассказчик",
      "Дмит достаёт бутылку газировки. Кед открывает пиво, а Данз внимательно смотрит на Дмита.",
      "sober-2",
      "Дмит",
      "Кед",
      { id: "sober-1" },
    ),
    line("Данз", "Ты реально не будешь?", "sober-3", "Дмит", "Данз", {
      id: "sober-2",
    }),
    line("Дмит", "Реально.", "sober-4", "Дмит", "Данз", { id: "sober-3" }),
    line("Данз", "Даже глоток?", "sober-5", "Дмит", "Данз", { id: "sober-4" }),
    line("Дмит", "Нет.", "sober-6", "Дмит", "Данз", { id: "sober-5" }),
    line("Данз", "Ты заболел?", "sober-7", "Дмит", "Данз", { id: "sober-6" }),
    line("Дмит", "Отъебись.", "sober-8", "Дмит", "Данз", { id: "sober-7" }),
    line(
      "Кед",
      "Не хочет — не пьёт. Всё правильно.",
      "sober-9",
      "Дмит",
      "Кед",
      { id: "sober-8" },
    ),
    line("Данз", "Я просто проверял.", "sober-10", "Дмит", "Данз", {
      id: "sober-9",
    }),
    line("Дмит", "Чё ты проверял?", "sober-11", "Дмит", "Данз", {
      id: "sober-10",
    }),
    line("Данз", "Силу воли.", "sober-12", "Дмит", "Данз", { id: "sober-11" }),
    line("Кед", "Проверь свою. Помолчи минуту.", "sober-13", "Дмит", "Кед", {
      id: "sober-12",
    }),
    line("Данз", "Это невозможно.", "sober-14", "Дмит", "Данз", {
      id: "sober-13",
    }),
    line("Кед", "Вот и всё.", "sober-15", "Дмит", "Кед", { id: "sober-14" }),
    line(
      "Дмит",
      "Давайте уже сидеть нормально.",
      "first-talk-1",
      "Дмит",
      "Кед",
      { id: "sober-15", effects: { flags: ["CHAPTER_1_ALCOHOL_SOBER"] } },
    ),

    line(
      "Кед",
      "Я сегодня на тренировке семьдесят пожал.",
      "first-talk-2",
      "Дмит",
      "Кед",
      { id: "first-talk-1" },
    ),
    line("Дмит", "Килограмм?", "first-talk-3", "Дмит", "Кед", {
      id: "first-talk-2",
    }),
    line("Кед", "Нет, раз.", "first-talk-4", "Дмит", "Кед", {
      id: "first-talk-3",
    }),
    line("Данз", "Семьдесят раз?", "first-talk-5", "Дмит", "Данз", {
      id: "first-talk-4",
    }),
    line("Кед", "Килограмм, дебил.", "first-talk-6", "Дмит", "Кед", {
      id: "first-talk-5",
    }),
    line("Дмит", "Нормально.", "first-talk-7", "Дмит", "Кед", {
      id: "first-talk-6",
    }),
    line(
      "Кед",
      "Чисто сделал. Тренер даже кивнул.",
      "first-talk-8",
      "Дмит",
      "Кед",
      { id: "first-talk-7" },
    ),
    line(
      "Данз",
      "Может, у него шея заболела.",
      "first-talk-9",
      "Дмит",
      "Данз",
      { id: "first-talk-8" },
    ),
    line(
      "Кед",
      "Может, тебе сейчас лицо заболит.",
      "first-talk-10",
      "Дмит",
      "Кед",
      { id: "first-talk-9" },
    ),
    line(
      "Данз",
      "Агрессия — признак сексуального напряжения.",
      "first-talk-11",
      "Дмит",
      "Данз",
      { id: "first-talk-10" },
    ),
    line("Дмит", "Данз, пять минут прошло.", "first-talk-12", "Дмит", "Данз", {
      id: "first-talk-11",
    }),
    line("Данз", "Я держался.", "first-talk-13", "Дмит", "Данз", {
      id: "first-talk-12",
    }),
    line("Кед", "Ты не держался.", "first-talk-14", "Дмит", "Кед", {
      id: "first-talk-13",
    }),
    line(
      "Данз",
      "Это тоже можно понять пошло.",
      "first-talk-15",
      "Дмит",
      "Данз",
      { id: "first-talk-14" },
    ),
    line("Дмит", "Бля…", "mishgan-route", "Дмит", "Данз", {
      id: "first-talk-15",
    }),
    {
      id: "mishgan-route",
      speaker: "Рассказчик",
      text: "Со стороны гаражей появляется Мишган. На плече у него спортивная сумка, а футболка после тренировки прилипла к спине.",
      left: "Дмит",
      right: "Данз",
      background: "minika",
      nextByFlag: [
        {
          flag: "CHAPTER_1_LEFT_MISHGAN",
          next: "mishgan-bad-1",
        },
      ],
      fallbackNext: "mishgan-good-1",
    },

    line(
      "Мишган",
      "Уф-уф, бля! Спортивная делегация уже собралась!",
      "mishgan-good-2",
      "Дмит",
      "Мишган",
      { id: "mishgan-good-1" },
    ),
    line("Кед", "О, боксёр.", "mishgan-good-3", "Дмит", "Кед", {
      id: "mishgan-good-2",
    }),
    line("Дмит", "Здорово.", "mishgan-good-4", "Дмит", "Кед", {
      id: "mishgan-good-3",
    }),
    line("Мишган", "Здорово, братан.", "mishgan-good-5", "Дмит", "Мишган", {
      id: "mishgan-good-4",
    }),
    line("Данз", "Чё такой мокрый?", "mishgan-good-6", "Дмит", "Данз", {
      id: "mishgan-good-5",
    }),
    line("Мишган", "Тренировка.", "mishgan-good-7", "Дмит", "Мишган", {
      id: "mishgan-good-6",
    }),
    line("Данз", "А я подумал, ты вспотел.", "mishgan-good-8", "Дмит", "Данз", {
      id: "mishgan-good-7",
    }),
    line("Мишган", "Я и вспотел.", "mishgan-good-9", "Дмит", "Мишган", {
      id: "mishgan-good-8",
    }),
    line(
      "Данз",
      "Тогда я правильно подумал.",
      "mishgan-good-10",
      "Дмит",
      "Данз",
      { id: "mishgan-good-9" },
    ),
    line(
      "Кед",
      "Иногда лучше не рассказывать нам, что ты думаешь.",
      "mishgan-good-11",
      "Дмит",
      "Кед",
      { id: "mishgan-good-10" },
    ),
    line("Мишган", "Дмит, место есть?", "mishgan-good-12", "Дмит", "Мишган", {
      id: "mishgan-good-11",
    }),
    line("Дмит", "Садись.", "mishgan-good-13", "Дмит", "Мишган", {
      id: "mishgan-good-12",
    }),
    line(
      "Мишган",
      "Уф-уф. Вот это угол команды.",
      "mishgan-good-14",
      "Дмит",
      "Мишган",
      { id: "mishgan-good-13" },
    ),
    line(
      "Рассказчик",
      "Мишган садится рядом с Дмитом и дружески бьёт его кулаком в плечо.",
      "mishgan-good-15",
      "Дмит",
      "Мишган",
      { id: "mishgan-good-14" },
    ),
    line(
      "Дмит",
      "Тише, бля. Ты мне руку сломаешь.",
      "mishgan-good-16",
      "Дмит",
      "Мишган",
      { id: "mishgan-good-15" },
    ),
    line(
      "Мишган",
      "Это лёгкое приветствие.",
      "mishgan-good-17",
      "Дмит",
      "Мишган",
      { id: "mishgan-good-16" },
    ),
    line(
      "Дмит",
      "У тебя лёгкое — как у других тяжёлое.",
      "hangout-1",
      "Дмит",
      "Мишган",
      {
        id: "mishgan-good-17",
        effects: { flags: ["CHAPTER_1_MISHGAN_GOOD_AT_MINIKA"] },
      },
    ),

    line("Мишган", "Здорово.", "mishgan-bad-2", "Дмит", "Мишган", {
      id: "mishgan-bad-1",
      rightEmotion: "sad",
    }),
    line("Кед", "О, Мишган. Садись.", "mishgan-bad-3", "Дмит", "Кед", {
      id: "mishgan-bad-2",
    }),
    line(
      "Данз",
      "Чё такой грустный? В боксе мяч потеряли?",
      "mishgan-bad-4",
      "Дмит",
      "Данз",
      { id: "mishgan-bad-3" },
    ),
    line("Мишган", "В боксе нет мяча.", "mishgan-bad-5", "Дмит", "Мишган", {
      id: "mishgan-bad-4",
      rightEmotion: "sad",
    }),
    line("Данз", "Вот поэтому и грустный.", "mishgan-bad-6", "Дмит", "Данз", {
      id: "mishgan-bad-5",
    }),
    line("Дмит", "Здорово.", "mishgan-bad-7", "Дмит", "Данз", {
      id: "mishgan-bad-6",
    }),
    line("Мишган", "Ага.", "mishgan-bad-8", "Дмит", "Мишган", {
      id: "mishgan-bad-7",
      rightEmotion: "sad",
    }),
    line(
      "Рассказчик",
      "Мишган садится с другого края лавки. На Дмита он почти не смотрит.",
      "mishgan-bad-9",
      "Дмит",
      "Мишган",
      { id: "mishgan-bad-8" },
    ),
    line("Кед", "Вы чё, поругались?", "mishgan-bad-10", "Дмит", "Кед", {
      id: "mishgan-bad-9",
    }),
    line("Дмит", "Да нет.", "mishgan-bad-11", "Дмит", "Кед", {
      id: "mishgan-bad-10",
    }),
    line(
      "Мишган",
      "Он просто быстро бегает.",
      "mishgan-bad-12",
      "Дмит",
      "Мишган",
      { id: "mishgan-bad-11", rightEmotion: "sad" },
    ),
    line("Данз", "Кто?", "mishgan-bad-13", "Дмит", "Данз", {
      id: "mishgan-bad-12",
    }),
    line("Мишган", "Дмит.", "mishgan-bad-14", "Дмит", "Мишган", {
      id: "mishgan-bad-13",
      rightEmotion: "sad",
    }),
    line("Кед", "А-а.", "mishgan-bad-15", "Дмит", "Кед", {
      id: "mishgan-bad-14",
    }),
    line("Дмит", "Мишган…", "mishgan-choice", "Дмит", "Кед", {
      id: "mishgan-bad-15",
    }),
    {
      id: "mishgan-choice",
      speaker: "Мишган",
      text: "Чё?",
      left: "Дмит",
      right: "Мишган",
      background: "minika",
      rightEmotion: "sad",
      choices: [
        {
          label: "Слушай, я хуёво поступил. Извини.",
          shortLabel: "Слушай, я хуёво поступил. Извини.",
          next: "apology-1",
          effects: {
            experience: 10,
            relations: {
              Мишган: 3,
            },
            flags: ["CHAPTER_1_APOLOGIZED_TO_MISHGAN"],
          },
        },
        {
          label: "Да ничё. Пиво будешь?",
          shortLabel: "Да ничё. Пиво будешь?",
          next: "no-apology-1",
          effects: {
            relations: {
              Мишган: -2,
            },
            flags: ["CHAPTER_1_DID_NOT_APOLOGIZE_TO_MISHGAN"],
          },
        },
      ],
    },

    line(
      "Дмит",
      "Слушай, я хуёво поступил. Извини.",
      "apology-2",
      "Дмит",
      "Кед",
      { id: "apology-1" },
    ),
    line("Мишган", "За что именно?", "apology-3", "Дмит", "Мишган", {
      id: "apology-2",
    }),
    line("Дмит", "За то, что тебя бросил.", "apology-4", "Дмит", "Мишган", {
      id: "apology-3",
    }),
    line(
      "Мишган",
      "Сам понял или отец объяснил?",
      "apology-5",
      "Дмит",
      "Мишган",
      { id: "apology-4" },
    ),
    line("Дмит", "Сам.", "apology-6", "Дмит", "Мишган", { id: "apology-5" }),
    line("Мишган", "Точно?", "apology-7", "Дмит", "Мишган", {
      id: "apology-6",
    }),
    line("Дмит", "Ну… отец тоже сказал.", "apology-8", "Дмит", "Мишган", {
      id: "apology-7",
    }),
    line("Кед", "Главное, что сказал.", "apology-9", "Дмит", "Кед", {
      id: "apology-8",
    }),
    line("Данз", "Я тоже могу извиниться.", "apology-10", "Дмит", "Данз", {
      id: "apology-9",
    }),
    line("Кед", "Ты тут при чём?", "apology-11", "Дмит", "Кед", {
      id: "apology-10",
    }),
    line(
      "Данз",
      "У меня много долгов перед обществом.",
      "apology-12",
      "Дмит",
      "Данз",
      { id: "apology-11" },
    ),
    line(
      "Дмит",
      "Мишган, короче, я затупил. Надо было помочь.",
      "apology-13",
      "Дмит",
      "Данз",
      { id: "apology-12" },
    ),
    line("Мишган", "Надо было.", "apology-14", "Дмит", "Мишган", {
      id: "apology-13",
    }),
    line("Дмит", "Так ты простишь или нет?", "apology-15", "Дмит", "Мишган", {
      id: "apology-14",
    }),
    line(
      "Рассказчик",
      "Мишган несколько секунд смотрит на Дмита, а потом протягивает руку.",
      "apology-16",
      "Дмит",
      "Мишган",
      { id: "apology-15" },
    ),
    line("Мишган", "Давай руку.", "apology-17", "Дмит", "Мишган", {
      id: "apology-16",
    }),
    line("Дмит", "А бить не будешь?", "apology-18", "Дмит", "Мишган", {
      id: "apology-17",
    }),
    line("Мишган", "Не буду.", "apology-19", "Дмит", "Мишган", {
      id: "apology-18",
    }),
    line("Дмит", "Точно?", "apology-20", "Дмит", "Мишган", {
      id: "apology-19",
    }),
    line(
      "Мишган",
      "Бля, Дмит, я мириться хочу.",
      "apology-21",
      "Дмит",
      "Мишган",
      { id: "apology-20" },
    ),
    line("Дмит", "Ну держи.", "apology-22", "Дмит", "Мишган", {
      id: "apology-21",
    }),
    line("Рассказчик", "Они пожимают руки.", "apology-23", "Дмит", "Мишган", {
      id: "apology-22",
    }),
    line("Мишган", "Всё. Проехали.", "apology-24", "Дмит", "Мишган", {
      id: "apology-23",
    }),
    line("Дмит", "Всё?", "apology-25", "Дмит", "Мишган", { id: "apology-24" }),
    line(
      "Мишган",
      "Но если ещё раз бросишь — проведу воспитательный спарринг.",
      "apology-26",
      "Дмит",
      "Мишган",
      { id: "apology-25" },
    ),
    line("Дмит", "Понял.", "apology-27", "Дмит", "Мишган", {
      id: "apology-26",
    }),
    line("Мишган", "Уф-уф. Снова команда.", "apology-28", "Дмит", "Мишган", {
      id: "apology-27",
    }),
    line("Кед", "Красиво.", "apology-29", "Дмит", "Кед", { id: "apology-28" }),
    line("Данз", "Я чуть не заплакал.", "apology-30", "Дмит", "Данз", {
      id: "apology-29",
    }),
    line("Кед", "Ты от пива икнул.", "apology-31", "Дмит", "Кед", {
      id: "apology-30",
    }),
    line(
      "Данз",
      "Это была мужская слеза из желудка.",
      "apology-32",
      "Дмит",
      "Данз",
      { id: "apology-31" },
    ),
    line("Дмит", "Фу, бля.", "hangout-1", "Дмит", "Данз", {
      id: "apology-32",
      effects: { flags: ["CHAPTER_1_APOLOGIZED_TO_MISHGAN"] },
    }),

    line("Дмит", "Да ничё. Пиво будешь?", "no-apology-2", "Дмит", "Кед", {
      id: "no-apology-1",
    }),
    line("Мишган", "Нет.", "no-apology-3", "Дмит", "Мишган", {
      id: "no-apology-2",
      rightEmotion: "sad",
    }),
    line("Дмит", "Как хочешь.", "no-apology-4", "Дмит", "Мишган", {
      id: "no-apology-3",
    }),
    line("Кед", "Дмит…", "no-apology-5", "Дмит", "Кед", { id: "no-apology-4" }),
    line("Дмит", "Чё?", "no-apology-6", "Дмит", "Кед", { id: "no-apology-5" }),
    line("Кед", "Ничё.", "no-apology-7", "Дмит", "Кед", { id: "no-apology-6" }),
    line("Мишган", "Я после тренировки.", "no-apology-8", "Дмит", "Мишган", {
      id: "no-apology-7",
      rightEmotion: "sad",
    }),
    line("Данз", "Спортсмен.", "no-apology-9", "Дмит", "Данз", {
      id: "no-apology-8",
    }),
    line("Мишган", "Ага.", "no-apology-10", "Дмит", "Мишган", {
      id: "no-apology-9",
      rightEmotion: "sad",
    }),
    line(
      "Рассказчик",
      "Мишган остаётся с компанией, но с Дмитом больше не разговаривает.",
      "no-apology-11",
      "Дмит",
      "Мишган",
      { id: "no-apology-10" },
    ),
    line(
      "Дмит",
      "Ладно, давайте не сидеть как на похоронах.",
      "no-apology-12",
      "Дмит",
      "Мишган",
      { id: "no-apology-11" },
    ),
    line("Мишган", "Я нормально сижу.", "no-apology-13", "Дмит", "Мишган", {
      id: "no-apology-12",
      rightEmotion: "sad",
    }),
    line("Дмит", "Я не про тебя.", "no-apology-14", "Дмит", "Мишган", {
      id: "no-apology-13",
    }),
    line("Мишган", "Конечно.", "no-apology-15", "Дмит", "Мишган", {
      id: "no-apology-14",
      rightEmotion: "sad",
    }),
    line("Кед", "Давайте тему сменим.", "hangout-1", "Дмит", "Кед", {
      id: "no-apology-15",
      effects: { flags: ["CHAPTER_1_DID_NOT_APOLOGIZE_TO_MISHGAN"] },
    }),

    line("Кед", "Мишган, чё на тренировке было?", "hangout-2", "Дмит", "Кед", {
      id: "hangout-1",
    }),
    line("Мишган", "Сегодня спарринги.", "hangout-3", "Дмит", "Мишган", {
      id: "hangout-2",
    }),
    line("Данз", "С девчонками?", "hangout-4", "Дмит", "Данз", {
      id: "hangout-3",
    }),
    line("Мишган", "С мужиками.", "hangout-5", "Дмит", "Мишган", {
      id: "hangout-4",
    }),
    line("Данз", "Жаль.", "hangout-6", "Дмит", "Данз", { id: "hangout-5" }),
    line(
      "Мишган",
      "С большими, потными мужиками, бля.",
      "hangout-7",
      "Дмит",
      "Мишган",
      { id: "hangout-6" },
    ),
    line("Данз", "Так даже интереснее звучит.", "hangout-8", "Дмит", "Данз", {
      id: "hangout-7",
    }),
    line("Мишган", "Чё?", "hangout-9", "Дмит", "Мишган", { id: "hangout-8" }),
    line("Кед", "Не слушай его.", "hangout-10", "Дмит", "Кед", {
      id: "hangout-9",
    }),
    line(
      "Мишган",
      "Один меня в угол зажал. Я ему — уф-уф! Левый, правый, уклон!",
      "hangout-11",
      "Дмит",
      "Мишган",
      { id: "hangout-10" },
    ),
    line("Дмит", "И чё?", "hangout-12", "Дмит", "Мишган", { id: "hangout-11" }),
    line("Мишган", "Он меня ударил.", "hangout-13", "Дмит", "Мишган", {
      id: "hangout-12",
    }),
    line("Кед", "А дальше?", "hangout-14", "Дмит", "Кед", { id: "hangout-13" }),
    line("Мишган", "Я упал.", "hangout-15", "Дмит", "Мишган", {
      id: "hangout-14",
    }),
    line("Данз", "Победил?", "hangout-16", "Дмит", "Данз", {
      id: "hangout-15",
    }),
    line(
      "Мишган",
      "Конечно. Лёжа восстановил дыхание.",
      "hangout-17",
      "Дмит",
      "Мишган",
      { id: "hangout-16" },
    ),
    line(
      "Дмит",
      "Это называется тебя уронили.",
      "hangout-18",
      "Дмит",
      "Мишган",
      { id: "hangout-17" },
    ),
    line(
      "Мишган",
      "Это называется работа с нижнего уровня.",
      "hangout-19",
      "Дмит",
      "Мишган",
      { id: "hangout-18" },
    ),
    line("Кед", "Главное, что живой.", "hangout-20", "Дмит", "Кед", {
      id: "hangout-19",
    }),
    line(
      "Мишган",
      "Бокс — это шахматы кулаками.",
      "hangout-21",
      "Дмит",
      "Мишган",
      { id: "hangout-20" },
    ),
    line(
      "Данз",
      "А если кулаками играть в обычные шахматы?",
      "hangout-22",
      "Дмит",
      "Данз",
      { id: "hangout-21" },
    ),
    line("Мишган", "Будет быстрый матч.", "hangout-23", "Дмит", "Мишган", {
      id: "hangout-22",
    }),
    line(
      "Дмит",
      "Данз, а ты сегодня чё делал?",
      "hangout-24",
      "Дмит",
      "Мишган",
      { id: "hangout-23" },
    ),
    line("Данз", "Я мэром стал.", "hangout-25", "Дмит", "Данз", {
      id: "hangout-24",
    }),
    line("Кед", "Где?", "hangout-26", "Дмит", "Кед", { id: "hangout-25" }),
    line("Данз", "В САМПе.", "hangout-27", "Дмит", "Данз", {
      id: "hangout-26",
    }),
    line("Дмит", "Ты же вчера таксистом был.", "hangout-28", "Дмит", "Данз", {
      id: "hangout-27",
    }),
    line("Данз", "Политическая карьера.", "hangout-29", "Дмит", "Данз", {
      id: "hangout-28",
    }),
    line("Мишган", "А чё мэр делает?", "hangout-30", "Дмит", "Мишган", {
      id: "hangout-29",
    }),
    line(
      "Данз",
      "Команды даёт. Машина служебная. Охрана. Секретарша.",
      "hangout-31",
      "Дмит",
      "Данз",
      { id: "hangout-30" },
    ),
    line("Кед", "Секретарша тоже мужик?", "hangout-32", "Дмит", "Кед", {
      id: "hangout-31",
    }),
    line("Данз", "Не проверял.", "hangout-33", "Дмит", "Данз", {
      id: "hangout-32",
    }),
    line("Дмит", "Значит, мужик.", "hangout-34", "Дмит", "Данз", {
      id: "hangout-33",
    }),
    line("Данз", "Главное — душа.", "hangout-35", "Дмит", "Данз", {
      id: "hangout-34",
    }),
    line(
      "Мишган",
      "Я могу стать министром бокса?",
      "hangout-36",
      "Дмит",
      "Мишган",
      { id: "hangout-35" },
    ),
    line("Данз", "Такой должности нет.", "hangout-37", "Дмит", "Данз", {
      id: "hangout-36",
    }),
    line("Мишган", "Создай.", "hangout-38", "Дмит", "Мишган", {
      id: "hangout-37",
    }),
    line("Данз", "За взятку.", "hangout-39", "Дмит", "Данз", {
      id: "hangout-38",
    }),
    line("Кед", "Вот она — настоящая политика.", "hangout-40", "Дмит", "Кед", {
      id: "hangout-39",
    }),
    line(
      "Дмит",
      "Кед, покажи, как ты семьдесят жал.",
      "hangout-41",
      "Дмит",
      "Кед",
      { id: "hangout-40" },
    ),
    line("Кед", "Здесь?", "hangout-42", "Дмит", "Кед", { id: "hangout-41" }),
    line("Дмит", "Ну да.", "hangout-43", "Дмит", "Кед", { id: "hangout-42" }),
    line("Кед", "Мне лавку поднять?", "hangout-44", "Дмит", "Кед", {
      id: "hangout-43",
    }),
    line("Данз", "Подними меня.", "hangout-45", "Дмит", "Данз", {
      id: "hangout-44",
    }),
    line("Кед", "Тебя куда?", "hangout-46", "Дмит", "Кед", {
      id: "hangout-45",
    }),
    line("Данз", "На руки.", "hangout-47", "Дмит", "Данз", {
      id: "hangout-46",
    }),
    line("Кед", "Ты сегодня решил умереть?", "hangout-48", "Дмит", "Кед", {
      id: "hangout-47",
    }),
    line(
      "Данз",
      "Хотел почувствовать себя девушкой.",
      "hangout-49",
      "Дмит",
      "Данз",
      { id: "hangout-48" },
    ),
    line("Дмит", "Всё, хватит ему наливать.", "hangout-50", "Дмит", "Данз", {
      id: "hangout-49",
    }),
    line(
      "Данз",
      "Я ещё первую банку не допил.",
      "drunk-route",
      "Дмит",
      "Данз",
      { id: "hangout-50" },
    ),
    {
      id: "drunk-route",
      speaker: "Кед",
      text: "Тем более страшно.",
      left: "Дмит",
      right: "Кед",
      background: "minika",
      nextByFlag: [
        {
          flag: "CHAPTER_1_ALCOHOL_HEAVY",
          next: "drunk-heavy-1",
        },
        {
          flag: "CHAPTER_1_ALCOHOL_BEER",
          next: "drunk-beer-1",
        },
        {
          flag: "CHAPTER_1_ALCOHOL_SOBER",
          next: "drunk-sober-1",
        },
      ],
      fallbackNext: "drunk-sober-1",
    },

    line(
      "Рассказчик",
      "Пиво постепенно заканчивается. Водка тоже почему-то убывает гораздо быстрее, чем все планировали.",
      "drunk-heavy-2",
      "Дмит",
      "Кед",
      { id: "drunk-heavy-1" },
    ),
    line("Дмит", "Пацаны.", "drunk-heavy-3", "Дмит", "Кед", {
      id: "drunk-heavy-2",
    }),
    line("Кед", "Чё?", "drunk-heavy-4", "Дмит", "Кед", { id: "drunk-heavy-3" }),
    line(
      "Дмит",
      "А если гречку посадить в землю, вырастет каша?",
      "drunk-heavy-5",
      "Дмит",
      "Кед",
      { id: "drunk-heavy-4" },
    ),
    line("Кед", "Нет.", "drunk-heavy-6", "Дмит", "Кед", {
      id: "drunk-heavy-5",
    }),
    line("Дмит", "Почему?", "drunk-heavy-7", "Дмит", "Кед", {
      id: "drunk-heavy-6",
    }),
    line(
      "Кед",
      "Потому что каша уже приготовлена.",
      "drunk-heavy-8",
      "Дмит",
      "Кед",
      { id: "drunk-heavy-7" },
    ),
    line("Дмит", "А если сырую?", "drunk-heavy-9", "Дмит", "Кед", {
      id: "drunk-heavy-8",
    }),
    line("Кед", "Тогда вырастет…", "drunk-heavy-10", "Дмит", "Кед", {
      id: "drunk-heavy-9",
    }),
    line("Кед", "Бля, я не знаю.", "drunk-heavy-11", "Дмит", "Кед", {
      id: "drunk-heavy-10",
    }),
    line("Данз", "Гречневое дерево.", "drunk-heavy-12", "Дмит", "Данз", {
      id: "drunk-heavy-11",
    }),
    line("Мишган", "А на ветках блины.", "drunk-heavy-13", "Дмит", "Мишган", {
      id: "drunk-heavy-12",
    }),
    line("Дмит", "Во. Нормальная тема.", "drunk-heavy-14", "Дмит", "Мишган", {
      id: "drunk-heavy-13",
    }),
    line(
      "Кед",
      "Какие блины на гречневом дереве?",
      "drunk-heavy-15",
      "Дмит",
      "Кед",
      { id: "drunk-heavy-14" },
    ),
    line("Мишган", "Боксёрские.", "drunk-heavy-16", "Дмит", "Мишган", {
      id: "drunk-heavy-15",
    }),
    line(
      "Кед",
      "Чё значит боксёрские блины?",
      "drunk-heavy-17",
      "Дмит",
      "Кед",
      { id: "drunk-heavy-16" },
    ),
    line("Мишган", "Плоские.", "drunk-heavy-18", "Дмит", "Мишган", {
      id: "drunk-heavy-17",
    }),
    line(
      "Данз",
      "Как грудь у моей девушки в САМПе.",
      "drunk-heavy-19",
      "Дмит",
      "Данз",
      { id: "drunk-heavy-18" },
    ),
    line(
      "Дмит",
      "У неё моделька не прогрузилась.",
      "drunk-heavy-20",
      "Дмит",
      "Данз",
      { id: "drunk-heavy-19" },
    ),
    line("Данз", "Не порть отношения.", "drunk-heavy-21", "Дмит", "Данз", {
      id: "drunk-heavy-20",
    }),
    line(
      "Рассказчик",
      "Дмит пытается налить себе ещё, но некоторое время не может попасть стаканом под бутылку.",
      "drunk-heavy-22",
      "Дмит",
      "Данз",
      { id: "drunk-heavy-21" },
    ),
    line("Дмит", "Стакан двигается.", "drunk-heavy-23", "Дмит", "Данз", {
      id: "drunk-heavy-22",
    }),
    line("Кед", "Это твоя рука двигается.", "drunk-heavy-24", "Дмит", "Кед", {
      id: "drunk-heavy-23",
    }),
    line("Дмит", "Нет. Я руке доверяю.", "matvey-1", "Дмит", "Кед", {
      id: "drunk-heavy-24",
      effects: { flags: ["CHAPTER_1_DMIT_VERY_DRUNK"] },
    }),

    line(
      "Рассказчик",
      "Пустых банок становится больше. Разговор постепенно теряет смысл, но всем почему-то становится только веселее.",
      "drunk-beer-2",
      "Дмит",
      "Кед",
      { id: "drunk-beer-1" },
    ),
    line(
      "Дмит",
      "А почему район называется районом?",
      "drunk-beer-3",
      "Дмит",
      "Кед",
      { id: "drunk-beer-2" },
    ),
    line("Данз", "Потому что там рай.", "drunk-beer-4", "Дмит", "Данз", {
      id: "drunk-beer-3",
    }),
    line("Кед", "А «он» тогда зачем?", "drunk-beer-5", "Дмит", "Кед", {
      id: "drunk-beer-4",
    }),
    line("Данз", "Рай — он.", "drunk-beer-6", "Дмит", "Данз", {
      id: "drunk-beer-5",
    }),
    line("Мишган", "А ад — она?", "drunk-beer-7", "Дмит", "Мишган", {
      id: "drunk-beer-6",
    }),
    line("Дмит", "Не знаю.", "drunk-beer-8", "Дмит", "Мишган", {
      id: "drunk-beer-7",
    }),
    line(
      "Кед",
      "Бля, мы сейчас до философии допьёмся.",
      "drunk-beer-9",
      "Дмит",
      "Кед",
      { id: "drunk-beer-8" },
    ),
    line("Данз", "Я философ.", "drunk-beer-10", "Дмит", "Данз", {
      id: "drunk-beer-9",
    }),
    line("Дмит", "Ты мэр.", "drunk-beer-11", "Дмит", "Данз", {
      id: "drunk-beer-10",
    }),
    line("Данз", "Мэр-философ.", "drunk-beer-12", "Дмит", "Данз", {
      id: "drunk-beer-11",
    }),
    line("Мишган", "А я министр бокса.", "drunk-beer-13", "Дмит", "Мишган", {
      id: "drunk-beer-12",
    }),
    line("Кед", "Тогда я министр гречки.", "drunk-beer-14", "Дмит", "Кед", {
      id: "drunk-beer-13",
    }),
    line("Дмит", "А я кто?", "drunk-beer-15", "Дмит", "Кед", {
      id: "drunk-beer-14",
    }),
    line("Данз", "Первая леди.", "drunk-beer-16", "Дмит", "Данз", {
      id: "drunk-beer-15",
    }),
    line("Дмит", "Сам ты первая леди.", "drunk-beer-17", "Дмит", "Данз", {
      id: "drunk-beer-16",
    }),
    line(
      "Кед",
      "Не деритесь, правительство развалится.",
      "matvey-1",
      "Дмит",
      "Кед",
      { id: "drunk-beer-17", effects: { flags: ["CHAPTER_1_DMIT_DRUNK"] } },
    ),

    line(
      "Рассказчик",
      "Кед, Данз и Мишган говорят всё громче. Дмит пьёт газировку и наблюдает, как разговор медленно превращается в полный бред.",
      "drunk-sober-2",
      "Дмит",
      "Кед",
      { id: "drunk-sober-1" },
    ),
    line(
      "Данз",
      "Я как мэр заявляю: каждой девушке по Данзу.",
      "drunk-sober-3",
      "Дмит",
      "Данз",
      { id: "drunk-sober-2" },
    ),
    line(
      "Кед",
      "Тогда девушки уедут из города.",
      "drunk-sober-4",
      "Дмит",
      "Кед",
      { id: "drunk-sober-3" },
    ),
    line(
      "Мишган",
      "А каждому району по боксёрскому залу!",
      "drunk-sober-5",
      "Дмит",
      "Мишган",
      { id: "drunk-sober-4" },
    ),
    line("Данз", "Одобряю.", "drunk-sober-6", "Дмит", "Данз", {
      id: "drunk-sober-5",
    }),
    line("Кед", "И бесплатную гречку.", "drunk-sober-7", "Дмит", "Кед", {
      id: "drunk-sober-6",
    }),
    line("Данз", "Это разрушит бюджет.", "drunk-sober-8", "Дмит", "Данз", {
      id: "drunk-sober-7",
    }),
    line("Кед", "Тогда я устрою переворот.", "drunk-sober-9", "Дмит", "Кед", {
      id: "drunk-sober-8",
    }),
    line(
      "Мишган",
      "Я поддержу. Уф-уф, революция!",
      "drunk-sober-10",
      "Дмит",
      "Мишган",
      { id: "drunk-sober-9" },
    ),
    line("Дмит", "Вы долбоёбы.", "drunk-sober-11", "Дмит", "Мишган", {
      id: "drunk-sober-10",
    }),
    line("Данз", "Дмит будет оппозицией.", "drunk-sober-12", "Дмит", "Данз", {
      id: "drunk-sober-11",
    }),
    line(
      "Дмит",
      "Я буду единственным трезвым.",
      "drunk-sober-13",
      "Дмит",
      "Данз",
      { id: "drunk-sober-12" },
    ),
    line("Кед", "Ещё хуже.", "drunk-sober-14", "Дмит", "Кед", {
      id: "drunk-sober-13",
    }),
    line("Дмит", "Зато завтра всё вспомню.", "drunk-sober-15", "Дмит", "Кед", {
      id: "drunk-sober-14",
    }),
    line("Данз", "Предатель.", "matvey-1", "Дмит", "Данз", {
      id: "drunk-sober-15",
      effects: { flags: ["CHAPTER_1_DMIT_SOBER_AT_MINIKA"] },
    }),

    line(
      "Рассказчик",
      "Со стороны магазина слышатся голоса. На Миньку выходит другая компания — трое старших парней и две девушки.",
      "matvey-2",
      "Дмит",
      "Кед",
      {
        id: "matvey-1",
        tone: "danger",
        sound: "matvey-music",
        music: "matvey",
      },
    ),
    line(
      "Рассказчик",
      "Впереди идёт Матвей. Гроза Миньки, старший по району и человек, который всегда старается идти на полшага впереди своих друзей.",
      "matvey-3",
      "Дмит",
      "Кед",
      { id: "matvey-2", tone: "danger", music: "matvey" },
    ),
    line(
      "Рассказчик",
      "Ростом Матвей едва доходит Кеду до плеча, но смотрит на всех так, будто лично владеет каждым гаражом в Арбекове.",
      "matvey-4",
      "Дмит",
      "Кед",
      { id: "matvey-3", tone: "danger", music: "matvey" },
    ),
    line(
      "Данз",
      "Смотрите, делегация из маленького государства.",
      "matvey-5",
      "Дмит",
      "Данз",
      { id: "matvey-4", tone: "danger", music: "matvey" },
    ),
    line("Кед", "Тихо.", "matvey-6", "Дмит", "Кед", {
      id: "matvey-5",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Кто это сказал?", "matvey-7", "Дмит", "Матвей", {
      id: "matvey-6",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "Ветер.", "matvey-8", "Дмит", "Данз", {
      id: "matvey-7",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Матвей",
      "Ветер сейчас зубы потеряет.",
      "matvey-9",
      "Дмит",
      "Матвей",
      { id: "matvey-8", tone: "danger", music: "matvey" },
    ),
    line("Мишган", "У ветра зубов нет.", "matvey-10", "Дмит", "Мишган", {
      id: "matvey-9",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Матвей",
      "А тебя кто спрашивал, спортсмен?",
      "matvey-11",
      "Дмит",
      "Матвей",
      { id: "matvey-10", tone: "danger", music: "matvey" },
    ),
    line("Мишган", "Я сам отвечаю. Уф-уф.", "matvey-12", "Дмит", "Мишган", {
      id: "matvey-11",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Съебали с лавки.", "matvey-13", "Дмит", "Матвей", {
      id: "matvey-12",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "С хуя ли?", "matvey-14", "Дмит", "Матвей", {
      id: "matvey-13",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Потому что я сказал.", "matvey-15", "Дмит", "Матвей", {
      id: "matvey-14",
      tone: "danger",
      music: "matvey",
    }),
    line("Кед", "Мы раньше пришли.", "matvey-16", "Дмит", "Кед", {
      id: "matvey-15",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "И что?", "matvey-17", "Дмит", "Матвей", {
      id: "matvey-16",
      tone: "danger",
      music: "matvey",
    }),
    line("Кед", "То, что место занято.", "matvey-18", "Дмит", "Кед", {
      id: "matvey-17",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Минька моя.", "matvey-19", "Дмит", "Матвей", {
      id: "matvey-18",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "Документы покажи.", "matvey-20", "Дмит", "Данз", {
      id: "matvey-19",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Какие документы?", "matvey-21", "Дмит", "Матвей", {
      id: "matvey-20",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Данз",
      "На Миньку. Паспорт лавки, прописку качелей.",
      "matvey-22",
      "Дмит",
      "Данз",
      { id: "matvey-21", tone: "danger", music: "matvey" },
    ),
    line("Матвей", "Ты самый смешной, да?", "matvey-23", "Дмит", "Матвей", {
      id: "matvey-22",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "Мама говорит, что да.", "matvey-24", "Дмит", "Данз", {
      id: "matvey-23",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Матвей",
      "Сейчас твоя мама тебя не узнает.",
      "matvey-25",
      "Дмит",
      "Матвей",
      { id: "matvey-24", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "Ты чё доебался?", "matvey-26", "Дмит", "Матвей", {
      id: "matvey-25",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "А ты кто?", "matvey-27", "Дмит", "Матвей", {
      id: "matvey-26",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "Дмит.", "matvey-28", "Дмит", "Матвей", {
      id: "matvey-27",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Мне похуй.", "matvey-29", "Дмит", "Матвей", {
      id: "matvey-28",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "Тогда нахуя спросил?", "matvey-30", "Дмит", "Матвей", {
      id: "matvey-29",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Один из парней за спиной Матвея усмехается. Матвей резко оборачивается, и тот сразу перестаёт.",
      "matvey-31",
      "Дмит",
      "Матвей",
      { id: "matvey-30", tone: "danger", music: "matvey" },
    ),
    line(
      "Матвей",
      "Слушай сюда, Дмит. Вы сейчас собираете своё бухло и уходите.",
      "matvey-32",
      "Дмит",
      "Матвей",
      { id: "matvey-31", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "А если нет?", "matvey-33", "Дмит", "Матвей", {
      id: "matvey-32",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Тогда вам помогут.", "matvey-34", "Дмит", "Матвей", {
      id: "matvey-33",
      tone: "danger",
      music: "matvey",
    }),
    line("Мишган", "Кто?", "matvey-35", "Дмит", "Мишган", {
      id: "matvey-34",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Пацаны.", "matvey-36", "Дмит", "Матвей", {
      id: "matvey-35",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Двое старших парней делают шаг вперёд. Сам Матвей остаётся на месте.",
      "matvey-37",
      "Дмит",
      "Матвей",
      { id: "matvey-36", tone: "danger", music: "matvey" },
    ),
    line("Кед", "Чё сам не идёшь?", "matvey-38", "Дмит", "Кед", {
      id: "matvey-37",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Матвей",
      "Командир не обязан бегать впереди армии.",
      "matvey-39",
      "Дмит",
      "Матвей",
      { id: "matvey-38", tone: "danger", music: "matvey" },
    ),
    line("Данз", "Наполеон тоже так говорил.", "matvey-40", "Дмит", "Данз", {
      id: "matvey-39",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Матвей",
      "Ещё одна шутка про рост — и я тебя закопаю.",
      "matvey-41",
      "Дмит",
      "Матвей",
      { id: "matvey-40", tone: "danger", music: "matvey" },
    ),
    line("Данз", "Я про историю.", "matvey-42", "Дмит", "Данз", {
      id: "matvey-41",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Мне похуй.", "matvey-43", "Дмит", "Матвей", {
      id: "matvey-42",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "Всё сказал?", "matvey-44", "Дмит", "Матвей", {
      id: "matvey-43",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Матвей",
      "Нет. Теперь ты ответишь нормально.",
      "whose-minika-1",
      "Дмит",
      "Матвей",
      { id: "matvey-44", tone: "danger", music: "matvey" },
    ),

    line(
      "Матвей",
      "А теперь скажи, чья Минька.",
      "whose-minika-2",
      "Дмит",
      "Матвей",
      { id: "whose-minika-1", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "Чё?", "whose-minika-choice", "Дмит", "Матвей", {
      id: "whose-minika-2",
      tone: "danger",
      music: "matvey",
    }),
    {
      id: "whose-minika-choice",
      speaker: "Матвей",
      text: "Скажи: «Минька Матвея».",
      left: "Дмит",
      right: "Матвей",
      background: "minika",
      tone: "danger",
      music: "matvey",
      choices: [
        {
          label: "Минька Матвея.",
          shortLabel: "Минька Матвея.",
          next: "submit-1",
          effects: {
            flags: ["CHAPTER_1_MATVEY_HUMILIATED_DMIT"],
          },
        },
        {
          label: "Сам себе это скажи, коротышка.",
          shortLabel: "Сам себе это скажи, коротышка.",
          next: "fight-intro-1",
          effects: {
            flags: ["CHAPTER_1_MINIKA_FIGHT_STARTED"],
          },
        },
      ],
    },

    line("Дмит", "Минька Матвея.", "submit-2", "Дмит", "Кед", {
      id: "submit-1",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Не слышу.", "submit-3", "Дмит", "Матвей", {
      id: "submit-2",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "Минька Матвея, бля.", "submit-4", "Дмит", "Матвей", {
      id: "submit-3",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Матвей",
      "Вот. Можешь же нормально разговаривать.",
      "submit-5",
      "Дмит",
      "Матвей",
      { id: "submit-4", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "Пацаны, пошли.", "submit-6", "Дмит", "Матвей", {
      id: "submit-5",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Пиво оставьте.", "submit-7", "Дмит", "Матвей", {
      id: "submit-6",
      tone: "danger",
      music: "matvey",
    }),
    line("Кед", "Это уже наше.", "submit-8", "Дмит", "Кед", {
      id: "submit-7",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Было ваше.", "submit-9", "Дмит", "Матвей", {
      id: "submit-8",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "Кед, оставь.", "submit-10", "Дмит", "Матвей", {
      id: "submit-9",
      tone: "danger",
      music: "matvey",
    }),
    line("Кед", "Ты серьёзно?", "submit-11", "Дмит", "Кед", {
      id: "submit-10",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "Да пошли уже.", "submit-12", "Дмит", "Кед", {
      id: "submit-11",
      tone: "danger",
      music: "matvey",
    }),
    line("Мишган", "Уф…", "submit-13", "Дмит", "Мишган", {
      id: "submit-12",
      tone: "danger",
      rightEmotion: "sad",
      music: "matvey",
    }),
    line("Матвей", "Правильное решение.", "submit-14", "Дмит", "Матвей", {
      id: "submit-13",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Кед ставит пакет на лавку. Данз смотрит на оставшееся пиво так, будто прощается с близким родственником.",
      "submit-15",
      "Дмит",
      "Матвей",
      { id: "submit-14", tone: "danger", music: "matvey" },
    ),
    line("Данз", "Даже одну банку нельзя?", "submit-16", "Дмит", "Данз", {
      id: "submit-15",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Пошёл нахуй.", "submit-17", "Дмит", "Матвей", {
      id: "submit-16",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "Понял.", "submit-18", "Дмит", "Данз", {
      id: "submit-17",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Компания Дмита уходит с Миньки под смех Матвея и его друзей.",
      "submit-19",
      "Дмит",
      "Данз",
      { id: "submit-18", tone: "danger", music: "matvey" },
    ),
    line(
      "Дмит",
      "Ну а чё я должен был делать? Их больше.",
      "submit-20",
      "Дмит",
      "Данз",
      { id: "submit-19", tone: "danger", music: "matvey" },
    ),
    line("Кед", "Не знаю.", "submit-21", "Дмит", "Кед", {
      id: "submit-20",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Можно было хотя бы не говорить то, что он просил.",
      "submit-22",
      "Дмит",
      "Мишган",
      { id: "submit-21", tone: "danger", rightEmotion: "sad", music: "matvey" },
    ),
    line("Дмит", "Легко тебе говорить.", "submit-23", "Дмит", "Мишган", {
      id: "submit-22",
      tone: "danger",
      music: "matvey",
    }),
    line("Мишган", "Я бы не сказал.", "submit-24", "Дмит", "Мишган", {
      id: "submit-23",
      tone: "danger",
      rightEmotion: "sad",
      music: "matvey",
    }),
    line(
      "Дмит",
      "Ты вообще постоянно лезешь драться.",
      "submit-25",
      "Дмит",
      "Мишган",
      { id: "submit-24", tone: "danger", music: "matvey" },
    ),
    line(
      "Мишган",
      "Зато мои слова остаются моими.",
      "submit-26",
      "Дмит",
      "Мишган",
      { id: "submit-25", tone: "danger", rightEmotion: "sad", music: "matvey" },
    ),
    line("Данз", "Может, не будем ругаться?", "submit-27", "Дмит", "Данз", {
      id: "submit-26",
      tone: "danger",
      music: "matvey",
    }),
    line("Кед", "Лучше помолчи.", "submit-28", "Дмит", "Кед", {
      id: "submit-27",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Дмит идёт немного позади друзей. Вечер продолжается, но веселиться уже никому не хочется.",
      "quest-end",
      "Дмит",
      "Кед",
      {
        id: "submit-28",
        tone: "danger",
        effects: {
          reputation: -5,
          relations: { Кед: -2, Мишган: -3, Данз: -1 },
          flags: [
            "CHAPTER_1_MATVEY_HUMILIATED_DMIT",
            "MATVEY_HUMILIATED_DMIT",
            "CHAPTER_1_LOST_LEFTOVER_ALCOHOL",
          ],
        },
        music: "matvey",
      },
    ),

    line(
      "Дмит",
      "Сам себе это скажи, коротышка.",
      "fight-intro-2",
      "Дмит",
      "Кед",
      { id: "fight-intro-1", tone: "danger", music: "matvey" },
    ),
    line(
      "Рассказчик",
      "На Миньке становится тихо.",
      "fight-intro-3",
      "Дмит",
      "Кед",
      { id: "fight-intro-2", tone: "danger", music: "matvey" },
    ),
    line("Матвей", "Что ты сказал?", "fight-intro-4", "Дмит", "Матвей", {
      id: "fight-intro-3",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "Ты слышал.", "fight-intro-5", "Дмит", "Матвей", {
      id: "fight-intro-4",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Пацаны.", "fight-intro-6", "Дмит", "Матвей", {
      id: "fight-intro-5",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Друзья Матвея расходятся в стороны и встают напротив компании Дмита.",
      "fight-intro-7",
      "Дмит",
      "Матвей",
      { id: "fight-intro-6", tone: "danger", music: "matvey" },
    ),
    line("Кед", "Ну всё.", "fight-intro-8", "Дмит", "Кед", {
      id: "fight-intro-7",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Данз",
      "Может, ещё можно загрузить прошлое сохранение?",
      "fight-intro-9",
      "Дмит",
      "Данз",
      { id: "fight-intro-8", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "Поздно.", "fight-intro-10", "Дмит", "Данз", {
      id: "fight-intro-9",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Уф-уф, бля! Вот теперь начинается настоящий вечер!",
      "fight-intro-11",
      "Дмит",
      "Мишган",
      { id: "fight-intro-10", tone: "danger", music: "matvey" },
    ),
    line(
      "Рассказчик",
      "Мишган первым срывается с места и влетает в ближайшего парня.",
      "fight-intro-12",
      "Дмит",
      "Мишган",
      {
        id: "fight-intro-11",
        tone: "danger",
        sound: "dmit-run",
        music: "matvey",
      },
    ),
    line("Мишган", "ДЖЕБ! ПРАВЫЙ! УФ-УФ!", "fight-intro-13", "Дмит", "Мишган", {
      id: "fight-intro-12",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Валите их!", "cover-mishgan-choice", "Дмит", "Матвей", {
      id: "fight-intro-13",
      tone: "danger",
      music: "matvey",
    }),
    {
      id: "cover-mishgan-choice",
      speaker: "Рассказчик",
      text: "Пацан замахивается на Мишгана сбоку.",
      left: "Дмит",
      right: "Матвей",
      background: "minika",
      tone: "danger",
      music: "matvey",
      choices: [
        {
          label: "Влететь в драку и прикрыть Мишгана.",
          shortLabel: "Влететь в драку и прикрыть Мишгана.",
          narration: "Дмит влетает в драку и пытается закрыть Мишгана собой.",
          next: "help-mishgan-1",
          failNext: "no-intervene-1",
          requires: {
            strength: 6,
          },
          failureText:
            "Дмит рывком идёт к Мишгану, но тело слушается хуже, чем надо: его оттесняют, и Мишган остаётся против двоих.",
          effects: {
            flags: ["CHAPTER_1_DMIT_HELPED_MISHGAN_IN_FIGHT"],
          },
          failureEffects: {
            relations: {
              Мишган: -1,
            },
          },
        },
        {
          label: "Отбежать в сторону.",
          shortLabel: "Отбежать в сторону.",
          narration:
            "Дмит отскакивает в сторону, оставляя драку на секунду без своего участия.",
          next: "no-intervene-1",
          effects: {
            relations: {
              Мишган: -1,
            },
            flags: ["CHAPTER_1_DMIT_DID_NOT_COVER_MISHGAN"],
          },
        },
      ],
    },

    line("Дмит", "Мишган, слева!", "help-mishgan-2", "Дмит", "Кед", {
      id: "help-mishgan-1",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Дмит врезается в противника плечом и сбивает его удар.",
      "help-mishgan-3",
      "Дмит",
      "Кед",
      { id: "help-mishgan-2", tone: "danger", music: "matvey" },
    ),
    line("Пацан", "Ах ты сука!", "help-mishgan-4", "Дмит", "Пацан", {
      id: "help-mishgan-3",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Парень резко отвечает и попадает Дмиту кулаком по лицу.",
      "help-mishgan-5",
      "Дмит",
      "Пацан",
      { id: "help-mishgan-4", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "Бля!", "help-mishgan-6", "Дмит", "Пацан", {
      id: "help-mishgan-5",
      tone: "danger",
      music: "matvey",
    }),
    line("Мишган", "Держись, братан!", "help-mishgan-7", "Дмит", "Мишган", {
      id: "help-mishgan-6",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "Я держусь!", "help-mishgan-8", "Дмит", "Мишган", {
      id: "help-mishgan-7",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Во рту появляется металлический привкус, но Дмит остаётся на ногах.",
      "common-fight-1",
      "Дмит",
      "Мишган",
      {
        id: "help-mishgan-8",
        tone: "danger",
        effects: {
          relations: { Мишган: 2 },
          flags: ["CHAPTER_1_DMIT_DAMAGED", "DMIT_DAMAGED"],
        },
        music: "matvey",
      },
    ),

    line("Дмит", "Мишган, осторожно!", "no-intervene-2", "Дмит", "Кед", {
      id: "no-intervene-1",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Дмит отскакивает к краю площадки. Мишган остаётся против двоих.",
      "no-intervene-3",
      "Дмит",
      "Кед",
      { id: "no-intervene-2", tone: "danger", music: "matvey" },
    ),
    line(
      "Мишган",
      "Кричать все умеют, бля!",
      "no-intervene-4",
      "Дмит",
      "Мишган",
      {
        id: "no-intervene-3",
        tone: "danger",
        rightEmotion: "sad",
        music: "matvey",
      },
    ),
    line(
      "Дмит",
      "Я смотрю, где остальные!",
      "no-intervene-5",
      "Дмит",
      "Мишган",
      { id: "no-intervene-4", tone: "danger", music: "matvey" },
    ),
    line(
      "Мишган",
      "Ага! Глазами прикрываешь!",
      "common-fight-1",
      "Дмит",
      "Мишган",
      {
        id: "no-intervene-5",
        tone: "danger",
        rightEmotion: "sad",
        effects: {
          relations: { Мишган: -1 },
          flags: ["CHAPTER_1_DMIT_DID_NOT_COVER_MISHGAN"],
        },
        music: "matvey",
      },
    ),

    line(
      "Рассказчик",
      "Мишган уклоняется от размашистого удара и коротко бьёт противника в подбородок.",
      "common-fight-2",
      "Дмит",
      "Кед",
      { id: "common-fight-1", tone: "danger", music: "matvey" },
    ),
    line("Мишган", "УФ!", "common-fight-3", "Дмит", "Мишган", {
      id: "common-fight-2",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Пацан валится на землю и остаётся лежать.",
      "common-fight-4",
      "Дмит",
      "Мишган",
      { id: "common-fight-3", tone: "danger", music: "matvey" },
    ),
    line("Кед", "Одного вырубил!", "common-fight-5", "Дмит", "Кед", {
      id: "common-fight-4",
      tone: "danger",
      music: "matvey",
    }),
    line("Мишган", "Чистая техника, бля!", "common-fight-6", "Дмит", "Мишган", {
      id: "common-fight-5",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "Я тоже могу!", "common-fight-7", "Дмит", "Данз", {
      id: "common-fight-6",
      tone: "danger",
      music: "matvey",
    }),
    line("Кед", "Данз, стой!", "common-fight-8", "Дмит", "Кед", {
      id: "common-fight-7",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Данз разбегается, подпрыгивает и пытается влететь ногой во второго противника.",
      "common-fight-9",
      "Дмит",
      "Кед",
      { id: "common-fight-8", tone: "danger", music: "matvey" },
    ),
    line("Данз", "СУПЕРУДАР!", "common-fight-10", "Дмит", "Данз", {
      id: "common-fight-9",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Противник успевает отойти. Данз со всей силы влетает ногой Мишгану в колено.",
      "common-fight-11",
      "Дмит",
      "Данз",
      { id: "common-fight-10", tone: "danger", music: "matvey" },
    ),
    line("Мишган", "А-А-А, БЛЯ!", "common-fight-12", "Дмит", "Мишган", {
      id: "common-fight-11",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "Ой.", "common-fight-13", "Дмит", "Данз", {
      id: "common-fight-12",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Мишган падает на колени и хватается за ногу.",
      "common-fight-14",
      "Дмит",
      "Данз",
      { id: "common-fight-13", tone: "danger", music: "matvey" },
    ),
    line(
      "Мишган",
      "Ты чё творишь, долбоёб?!",
      "common-fight-15",
      "Дмит",
      "Мишган",
      { id: "common-fight-14", tone: "danger", music: "matvey" },
    ),
    line("Данз", "Я не специально!", "common-fight-16", "Дмит", "Данз", {
      id: "common-fight-15",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Ты мне ногу отбил!",
      "timed-help-choice",
      "Дмит",
      "Мишган",
      { id: "common-fight-16", tone: "danger", music: "matvey" },
    ),
    {
      id: "timed-help-choice",
      speaker: "Рассказчик",
      text: "Один из парней Матвея приближается к сидящему Мишгану.",
      left: "Дмит",
      right: "Мишган",
      background: "minika",
      tone: "danger",
      music: "matvey",
      choiceTimer: {
        durationSeconds: 8,
        defaultChoiceIndex: 1,
      },
      choices: [
        {
          label: "Снова прыгнуть в драку и помочь Мишгану.",
          shortLabel: "Снова прыгнуть в драку и помочь Мишгану.",
          narration:
            "Дмит снова бросается в драку, пока Мишган пытается подняться.",
          next: "return-fight-1",
          effects: {
            relations: {
              Мишган: 2,
            },
            flags: ["CHAPTER_1_DMIT_RETURNED_TO_FIGHT"],
          },
        },
        {
          label: "Остаться в стороне и кричать Мишгану.",
          shortLabel: "Остаться в стороне и кричать Мишгану.",
          narration:
            "Дмит остаётся в стороне и начинает кричать Мишгану, будто это не драка, а финал районной Олимпиады.",
          next: "shout-side-1",
          effects: {
            relations: {
              Мишган: -2,
            },
            flags: ["CHAPTER_1_DMIT_SHOUTED_FROM_SIDE"],
          },
        },
      ],
    },

    line("Дмит", "От него отошёл!", "return-fight-2", "Дмит", "Кед", {
      id: "return-fight-1",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Дмит бросается вперёд и толкает противника от Мишгана.",
      "return-fight-3",
      "Дмит",
      "Кед",
      { id: "return-fight-2", tone: "danger", music: "matvey" },
    ),
    line(
      "Пацан Матвея",
      "Сам напросился!",
      "return-fight-4",
      "Дмит",
      "Пацан Матвея",
      {
        id: "return-fight-3",
        tone: "danger",
        music: "matvey",
      },
    ),
    line("Дмит", "Да пошёл ты!", "return-fight-5", "Дмит", "Пацан Матвея", {
      id: "return-fight-4",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Уф… Хорошо вошёл, Дмит!",
      "return-fight-6",
      "Дмит",
      "Мишган",
      { id: "return-fight-5", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "Вставай давай!", "return-fight-7", "Дмит", "Мишган", {
      id: "return-fight-6",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "У меня нога в другое измерение ушла!",
      "decisive-1",
      "Дмит",
      "Мишган",
      {
        id: "return-fight-7",
        tone: "danger",
        effects: {
          relations: { Мишган: 1 },
          flags: ["CHAPTER_1_DMIT_RETURNED_TO_FIGHT"],
        },
        music: "matvey",
      },
    ),

    line("Дмит", "Мишган, вставай! Он справа!", "shout-side-2", "Дмит", "Кед", {
      id: "shout-side-1",
      tone: "danger",
      music: "matvey",
    }),
    line("Мишган", "Я вижу, бля!", "shout-side-3", "Дмит", "Мишган", {
      id: "shout-side-2",
      tone: "danger",
      rightEmotion: "sad",
      music: "matvey",
    }),
    line("Дмит", "Ударь его!", "shout-side-4", "Дмит", "Мишган", {
      id: "shout-side-3",
      tone: "danger",
      music: "matvey",
    }),
    line("Мишган", "Сам подойди и ударь!", "shout-side-5", "Дмит", "Мишган", {
      id: "shout-side-4",
      tone: "danger",
      rightEmotion: "sad",
      music: "matvey",
    }),
    line("Дмит", "Сзади ещё один!", "shout-side-6", "Дмит", "Мишган", {
      id: "shout-side-5",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Спасибо за радиопередачу!",
      "decisive-1",
      "Дмит",
      "Мишган",
      {
        id: "shout-side-6",
        tone: "danger",
        rightEmotion: "sad",
        effects: {
          relations: { Мишган: -1 },
          flags: ["CHAPTER_1_DMIT_SHOUTED_FROM_SIDE"],
        },
        music: "matvey",
      },
    ),

    line(
      "Данз",
      "Мишган, прости! Я целился не в тебя!",
      "decisive-2",
      "Дмит",
      "Данз",
      { id: "decisive-1", tone: "danger", music: "matvey" },
    ),
    line(
      "Мишган",
      "Ты вообще ни в кого больше не целься!",
      "decisive-3",
      "Дмит",
      "Мишган",
      { id: "decisive-2", tone: "danger", music: "matvey" },
    ),
    line("Данз", "Я сейчас всё исправлю!", "decisive-4", "Дмит", "Данз", {
      id: "decisive-3",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Данз снова бросается вперёд, но получает удар в грудь и падает рядом с лавкой.",
      "decisive-5",
      "Дмит",
      "Данз",
      { id: "decisive-4", tone: "danger", music: "matvey" },
    ),
    line("Данз", "Всё. Не исправил.", "decisive-6", "Дмит", "Данз", {
      id: "decisive-5",
      tone: "danger",
      music: "matvey",
    }),
    line("Кед", "Данз!", "decisive-7", "Дмит", "Кед", {
      id: "decisive-6",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "Я живой. Просто полежу.", "decisive-8", "Дмит", "Данз", {
      id: "decisive-7",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Мишган с криком поднимается на одну ногу.",
      "decisive-9",
      "Дмит",
      "Данз",
      { id: "decisive-8", tone: "danger", music: "matvey" },
    ),
    line("Мишган", "А-А-А! УФ-УФ, СУКА!", "decisive-10", "Дмит", "Мишган", {
      id: "decisive-9",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Он бросается на противника, делает нелепый кувырок и отлетает назад.",
      "decisive-11",
      "Дмит",
      "Мишган",
      { id: "decisive-10", tone: "danger", music: "matvey" },
    ),
    line(
      "Мишган",
      "Это был тактический отход!",
      "decisive-12",
      "Дмит",
      "Мишган",
      { id: "decisive-11", tone: "danger", music: "matvey" },
    ),
    line("Кед", "Ты через голову перекатился!", "decisive-13", "Дмит", "Кед", {
      id: "decisive-12",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Главное — дистанцию разорвал!",
      "decisive-hit-choice",
      "Дмит",
      "Мишган",
      { id: "decisive-13", tone: "danger", music: "matvey" },
    ),
    {
      id: "decisive-hit-choice",
      speaker: "Рассказчик",
      text: "Последний парень Матвея разворачивается к Дмиту. Его левый кулак летит прямо в голову.",
      left: "Дмит",
      right: "Мишган",
      background: "minika",
      tone: "danger",
      music: "matvey",
      choiceTimer: {
        durationSeconds: 8,
        defaultChoiceIndex: 0,
      },
      choices: [
        {
          label: "Отшатнуться назад.",
          shortLabel: "Отшатнуться назад.",
          narration: "Дмит резко отшатывается назад, пытаясь уйти от удара.",
          next: "wrong-back-1",
          effects: {
            flags: ["CHAPTER_1_DMIT_FAILED_DECISIVE_DODGE"],
          },
        },
        {
          label: "Шагнуть навстречу удару.",
          shortLabel: "Шагнуть навстречу удару.",
          narration:
            "Дмит шагает навстречу удару, выбирая самый спорный путь к уважению.",
          next: "wrong-forward-1",
          effects: {
            flags: ["CHAPTER_1_DMIT_FAILED_DECISIVE_DODGE"],
          },
        },
        {
          label: "Резко присесть и нырнуть под рукой.",
          shortLabel: "Резко присесть и нырнуть под рукой.",
          narration:
            "Дмит резко приседает и ныряет под рукой, уходя из линии удара.",
          next: "win-fight-1",
          effects: {
            flags: ["CHAPTER_1_DMIT_DODGED_DECISIVE_HIT"],
          },
        },
      ],
    },

    line("Дмит", "Бля!", "wrong-back-2", "Дмит", "Кед", {
      id: "wrong-back-1",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Дмит пытается отшатнуться, но удар всё равно задевает его в висок.",
      "wrong-back-3",
      "Дмит",
      "Кед",
      { id: "wrong-back-2", tone: "danger", music: "matvey" },
    ),
    line(
      "Рассказчик",
      "Он теряет равновесие, падает навзничь и ударяется головой об асфальт.",
      "wrong-back-4",
      "Дмит",
      "Кед",
      { id: "wrong-back-3", tone: "danger", music: "matvey" },
    ),
    line("Кед", "Дмит!", "wrong-back-5", "Дмит", "Кед", {
      id: "wrong-back-4",
      tone: "danger",
      music: "matvey",
    }),
    line("Мишган", "ДМИТ, БЛЯ!", "wrong-back-6", "Дмит", "Мишган", {
      id: "wrong-back-5",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Голоса друзей быстро отдаляются. Перед глазами становится темно.",
      "wrong-back-7",
      "Дмит",
      "Мишган",
      { id: "wrong-back-6", tone: "danger", music: "matvey" },
    ),
    line(
      "Рассказчик",
      "Дмит больше не приходит в сознание.",
      "whose-minika-1",
      "Дмит",
      "Мишган",
      {
        id: "wrong-back-7",
        tone: "danger",
        music: "matvey",
        transition: "checkpoint-fade",
      },
    ),

    line("Дмит", "Давай!", "wrong-forward-2", "Дмит", "Кед", {
      id: "wrong-forward-1",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Дмит пытается сократить расстояние, но шагает прямо под левый хук.",
      "wrong-forward-3",
      "Дмит",
      "Кед",
      { id: "wrong-forward-2", tone: "danger", music: "matvey" },
    ),
    line(
      "Рассказчик",
      "Кулак попадает ему в голову. Дмит падает и с силой ударяется затылком об асфальт.",
      "wrong-forward-4",
      "Дмит",
      "Кед",
      { id: "wrong-forward-3", tone: "danger", music: "matvey" },
    ),
    line("Данз", "Дмит?!", "wrong-forward-5", "Дмит", "Данз", {
      id: "wrong-forward-4",
      tone: "danger",
      music: "matvey",
    }),
    line("Кед", "Не трогайте его!", "wrong-forward-6", "Дмит", "Кед", {
      id: "wrong-forward-5",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Дмит! Слышишь меня?!",
      "wrong-forward-7",
      "Дмит",
      "Мишган",
      { id: "wrong-forward-6", tone: "danger", music: "matvey" },
    ),
    line(
      "Рассказчик",
      "Дмит слышит крики, но уже не может ответить.",
      "wrong-forward-8",
      "Дмит",
      "Мишган",
      { id: "wrong-forward-7", tone: "danger", music: "matvey" },
    ),
    line(
      "Рассказчик",
      "Сознание гаснет окончательно.",
      "whose-minika-1",
      "Дмит",
      "Мишган",
      {
        id: "wrong-forward-8",
        tone: "danger",
        music: "matvey",
        transition: "checkpoint-fade",
      },
    ),

    line(
      "Рассказчик",
      "Дмит резко приседает. Кулак проносится над его головой.",
      "win-fight-2",
      "Дмит",
      "Кед",
      { id: "win-fight-1", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "Мимо, сука!", "win-fight-3", "Дмит", "Кед", {
      id: "win-fight-2",
      tone: "danger",
      music: "matvey",
    }),
    line("Мишган", "УФ-УФ! В КОРПУС!", "win-fight-4", "Дмит", "Мишган", {
      id: "win-fight-3",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Не поднимаясь полностью, Дмит бьёт противника кулаком под дых.",
      "win-fight-5",
      "Дмит",
      "Мишган",
      { id: "win-fight-4", tone: "danger", music: "matvey" },
    ),
    line("Пацан", "Кх!", "win-fight-6", "Дмит", "Пацан", {
      id: "win-fight-5",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Парень складывается пополам и падает на колени, пытаясь вдохнуть.",
      "win-fight-7",
      "Дмит",
      "Пацан",
      { id: "win-fight-6", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "Всё?", "win-fight-8", "Дмит", "Пацан", {
      id: "win-fight-7",
      tone: "danger",
      music: "matvey",
    }),
    line("Кед", "Всё!", "win-fight-9", "Дмит", "Кед", {
      id: "win-fight-8",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Матвей смотрит на лежащих друзей, затем на Дмита и медленно отступает.",
      "win-fight-10",
      "Дмит",
      "Кед",
      { id: "win-fight-9", tone: "danger", music: "matvey" },
    ),
    line("Матвей", "Вы больные.", "win-fight-11", "Дмит", "Матвей", {
      id: "win-fight-10",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "А ты куда?", "win-fight-12", "Дмит", "Матвей", {
      id: "win-fight-11",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Я за помощью.", "win-fight-13", "Дмит", "Матвей", {
      id: "win-fight-12",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "За мамой?", "win-fight-14", "Дмит", "Данз", {
      id: "win-fight-13",
      tone: "danger",
      music: "matvey",
    }),
    line("Матвей", "Заткнись!", "win-fight-15", "Дмит", "Матвей", {
      id: "win-fight-14",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Командир покидает ринг!",
      "win-fight-16",
      "Дмит",
      "Мишган",
      { id: "win-fight-15", tone: "danger", music: "matvey" },
    ),
    line(
      "Матвей",
      "Это ещё не закончилось!",
      "win-fight-17",
      "Дмит",
      "Матвей",
      { id: "win-fight-16", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "Беги давай.", "win-fight-18", "Дмит", "Матвей", {
      id: "win-fight-17",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Матвей разворачивается и убегает в сторону домов.",
      "win-fight-19",
      "Дмит",
      "Матвей",
      { id: "win-fight-18", tone: "danger", music: "matvey" },
    ),
    line("Кед", "Гроза Миньки ушла.", "win-fight-20", "Дмит", "Кед", {
      id: "win-fight-19",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "Мелкий дождь остался.", "win-fight-21", "Дмит", "Данз", {
      id: "win-fight-20",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Данз, я тебя потом отдельно отпизжу.",
      "win-fight-22",
      "Дмит",
      "Мишган",
      { id: "win-fight-21", tone: "danger", music: "matvey" },
    ),
    line("Данз", "Я же извинился.", "win-fight-23", "Дмит", "Данз", {
      id: "win-fight-22",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Моя нога извинения не приняла.",
      "win-fight-24",
      "Дмит",
      "Мишган",
      { id: "win-fight-23", tone: "danger", music: "matvey" },
    ),
    line(
      "Рассказчик",
      "Кед подходит к лавке и забирает пакет с оставшимся пивом.",
      "win-fight-25",
      "Дмит",
      "Мишган",
      { id: "win-fight-24", tone: "danger", music: "matvey" },
    ),
    line("Кед", "Наше.", "win-fight-26", "Дмит", "Кед", {
      id: "win-fight-25",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "Вот теперь точно наше.", "win-fight-27", "Дмит", "Кед", {
      id: "win-fight-26",
      tone: "danger",
      music: "matvey",
    }),
    line("Мишган", "Минька общая, бля.", "win-fight-28", "Дмит", "Мишган", {
      id: "win-fight-27",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "Но пиво наше.", "win-fight-29", "Дмит", "Данз", {
      id: "win-fight-28",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Компания Матвея помогает своим подняться. Красивая девушка остаётся чуть в стороне и смотрит на Дмита.",
      "win-fight-30",
      "Дмит",
      "Данз",
      { id: "win-fight-29", tone: "danger", music: "matvey" },
    ),
    line(
      "Рассказчик",
      "Дмит замечает её взгляд.",
      "win-fight-31",
      "Дмит",
      "Данз",
      { id: "win-fight-30", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "Чё?", "win-fight-32", "Дмит", "Данз", {
      id: "win-fight-31",
      tone: "danger",
      music: "matvey",
    }),
    line("???", "Ничего.", "win-fight-33", "Дмит", "???", {
      id: "win-fight-32",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Девушка улыбается и машет ему рукой.",
      "win-fight-34",
      "Дмит",
      "???",
      { id: "win-fight-33", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "Ага… Пока.", "win-fight-35", "Дмит", "???", {
      id: "win-fight-34",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "Она тебе помахала.", "win-fight-36", "Дмит", "Данз", {
      id: "win-fight-35",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "Я видел.", "win-fight-37", "Дмит", "Данз", {
      id: "win-fight-36",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "Это любовь.", "win-fight-38", "Дмит", "Данз", {
      id: "win-fight-37",
      tone: "danger",
      music: "matvey",
    }),
    line("Кед", "Это просто рука.", "win-fight-39", "Дмит", "Кед", {
      id: "win-fight-38",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Точный выстрел по сердцу. Без блока.",
      "win-fight-40",
      "Дмит",
      "Мишган",
      { id: "win-fight-39", tone: "danger", music: "matvey" },
    ),
    line("Дмит", "Завалите ебало.", "win-fight-41", "Дмит", "Мишган", {
      id: "win-fight-40",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Рассказчик",
      "Девушка уходит вслед за компанией Матвея. Дмит, Кед, Данз и хромающий Мишган собирают вещи.",
      "win-fight-42",
      "Дмит",
      "Мишган",
      { id: "win-fight-41", tone: "danger", music: "matvey" },
    ),
    line("Кед", "Куда теперь?", "win-fight-43", "Дмит", "Кед", {
      id: "win-fight-42",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Я домой. Мне ногу Данз сломал.",
      "win-fight-44",
      "Дмит",
      "Мишган",
      { id: "win-fight-43", tone: "danger", music: "matvey" },
    ),
    line("Данз", "Не сломал же.", "win-fight-45", "Дмит", "Данз", {
      id: "win-fight-44",
      tone: "danger",
      music: "matvey",
    }),
    line("Мишган", "Тогда зачем она болит?", "win-fight-46", "Дмит", "Мишган", {
      id: "win-fight-45",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "Может, мышцы растут.", "win-fight-47", "Дмит", "Данз", {
      id: "win-fight-46",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Мишган",
      "Сейчас у тебя синяк вырастет.",
      "win-fight-48",
      "Дмит",
      "Мишган",
      { id: "win-fight-47", tone: "danger", music: "matvey" },
    ),
    line(
      "Дмит",
      "Всё, разошлись. И так нормально погуляли.",
      "win-fight-49",
      "Дмит",
      "Мишган",
      { id: "win-fight-48", tone: "danger", music: "matvey" },
    ),
    line("Кед", "Пиво забираем?", "win-fight-50", "Дмит", "Кед", {
      id: "win-fight-49",
      tone: "danger",
      music: "matvey",
    }),
    line("Дмит", "Конечно.", "win-fight-51", "Дмит", "Кед", {
      id: "win-fight-50",
      tone: "danger",
      music: "matvey",
    }),
    line("Данз", "А мне можно одну?", "win-fight-52", "Дмит", "Данз", {
      id: "win-fight-51",
      tone: "danger",
      music: "matvey",
    }),
    line(
      "Кед",
      "Тебе сегодня больше ничего нельзя.",
      "win-fight-53",
      "Дмит",
      "Кед",
      { id: "win-fight-52", tone: "danger", music: "matvey" },
    ),
    line(
      "Рассказчик",
      "Ребята расходятся по вечернему району. Минька остаётся позади вместе с пустыми банками, разбитой гордостью Матвея и новым знакомством, имени которого Дмит пока не знает.",
      "quest-end",
      "Дмит",
      "Кед",
      {
        id: "win-fight-53",
        tone: "danger",
        effects: {
          reputation: 5,
          relations: { Кед: 2, Мишган: 2, Данз: 1 },
          flags: [
            "CHAPTER_1_MATVEY_DEFEATED",
            "MATVEY_DEFEATED",
            "CHAPTER_1_UNKNOWN_GIRL_INTEREST",
            "UNKNOWN_GIRL_INTEREST",
          ],
        },
        music: "matvey",
      },
    ),

    {
      id: "quest-end",
      speaker: "Рассказчик",
      text: "Квест «Бухич на Миньке» завершён. Следующий этап: ночная прогулка по Арбеково.",
      left: "Дмит",
      right: "Кед",
      background: "minika",
      sound: "quest-complete",
      effects: {
        experience: 20,
        flags: ["CHAPTER_1_MINIKA_BOOZE_DONE"],
      },
    },
  ],
);
