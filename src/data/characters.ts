import dmitImage from "../assets/dmit/main.webp";
import tatyanaImage from "../assets/dmit/tatyana.webp";
import igorImage from "../assets/dmit/igor.webp";
import mishganImage from "../assets/savelich/main.webp";
import mishganSadImage from "../assets/savelich/грустный.webp";
import mishganAngryImage from "../assets/savelich/злой.webp";
import mishganHappyImage from "../assets/savelich/радостный.webp";
import mishganSurprisedImage from "../assets/savelich/удивлен.webp";
import kedImage from "../assets/ked/cropped/main.webp";
import kedAngryImage from "../assets/ked/cropped/злой.webp";
import kedHappyImage from "../assets/ked/cropped/радостный.webp";
import kedSurprisedImage from "../assets/ked/cropped/удивлен.webp";
import danzImage from "../assets/danz/danz.webp";
import geographyTeacherImage from "../assets/географичка/main.webp";
import guardImage from "../assets/охранник/main.webp";
import veronicaImage from "../assets/veronica/main.webp";
import matveyImage from "../assets/mat/main.webp";
import matveyGuyOneImage from "../assets/mat/pacan1.webp";
import matveyGuyTwoImage from "../assets/mat/pacan2.webp";
import darlonaImage from "../assets/darlona.webp";
import vadimImage from "../assets/vaz/main.webp";
import kopyarImage from "../assets/cap/main.webp";
import teacherImage from "../assets/chapter_2/quest-school-1/teacher.webp";
import type { Character, Emotion } from "../types/story";

type CharacterPresentation = {
  initial: string;
  className: string;
  images?: Partial<Record<Emotion, string>>;
};

export const characterPresentation: Record<
  Exclude<Character, "Рассказчик">,
  CharacterPresentation
> = {
  Дмит: { initial: "Д", className: "dmit", images: { default: dmitImage } },
  Мишган: {
    initial: "С",
    className: "mishgan",
    images: {
      default: mishganImage,
      sad: mishganSadImage,
      angry: mishganAngryImage,
      happy: mishganHappyImage,
      surprised: mishganSurprisedImage,
    },
  },
  Кед: {
    initial: "К",
    className: "ked",
    images: {
      default: kedImage,
      angry: kedAngryImage,
      happy: kedHappyImage,
      surprised: kedSurprisedImage,
    },
  },
  Данз: { initial: "Д", className: "danz", images: { default: danzImage } },
  Полина: { initial: "П", className: "polina" },
  Географичка: {
    initial: "Г",
    className: "geography-teacher",
    images: { default: geographyTeacherImage },
  },
  Вероника: {
    initial: "В",
    className: "veronika",
    images: { default: veronicaImage },
  },
  Охранник: {
    initial: "О",
    className: "guard",
    images: { default: guardImage },
  },
  Татьяна: {
    initial: "Т",
    className: "tatyana",
    images: { default: tatyanaImage },
  },
  Игорь: { initial: "И", className: "igor", images: { default: igorImage } },
  Папа: { initial: "П", className: "igor", images: { default: igorImage } },
  Матвей: {
    initial: "М",
    className: "matvey",
    images: { default: matveyImage },
  },
  "Приятель Матвея": { initial: "П", className: "matvey-guy" },
  Учительница: { initial: "У", className: "teacher", images: { default: teacherImage } },
  "Классная руководительница": { initial: "К", className: "teacher", images: { default: teacherImage } },
  Мама: { initial: "М", className: "tatyana", images: { default: tatyanaImage } },
  Вадим: { initial: "В", className: "vadim", images: { default: vadimImage } },
  Копяр: { initial: "К", className: "kopyar", images: { default: kopyarImage } },
  Незнакомка: { initial: "?", className: "stranger", images: { default: darlonaImage } },
  "???": { initial: "?", className: "stranger", images: { default: darlonaImage } },
  Пацан: {
    initial: "П",
    className: "matvey-guy",
    images: { default: matveyGuyOneImage },
  },
  "Пацан Матвея": {
    initial: "П",
    className: "matvey-guy",
    images: { default: matveyGuyTwoImage },
  },
  "Женщина из окна": { initial: "Ж", className: "balcony-woman" },
  "Женщина с балкона": { initial: "Ж", className: "balcony-woman" },
};

export { dmitImage };
