import dmitImage from "../assets/dmit/main.png";
import tatyanaImage from "../assets/dmit/tatyana.png";
import igorImage from "../assets/dmit/igor.png";
import mishganImage from "../assets/savelich/main.png";
import mishganSadImage from "../assets/savelich/грустный.png";
import mishganAngryImage from "../assets/savelich/злой.png";
import mishganHappyImage from "../assets/savelich/радостный.png";
import mishganSurprisedImage from "../assets/savelich/удивлен.png";
import kedImage from "../assets/ked/cropped/main.png";
import kedAngryImage from "../assets/ked/cropped/злой.png";
import kedHappyImage from "../assets/ked/cropped/радостный.png";
import kedSurprisedImage from "../assets/ked/cropped/удивлен.png";
import danzImage from "../assets/danz/danz.png";
import geographyTeacherImage from "../assets/географичка/main.png";
import guardImage from "../assets/охранник/main.png";
import veronicaImage from "../assets/veronica/main.png";
import matveyImage from "../assets/mat/main.png";
import matveyGuyOneImage from "../assets/mat/pacan1.png";
import matveyGuyTwoImage from "../assets/mat/pacan2.png";
import darlonaImage from "../assets/darlona.png";
import vadimImage from "../assets/vaz/main.png";
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
  Матвей: {
    initial: "М",
    className: "matvey",
    images: { default: matveyImage },
  },
  Вадим: { initial: "В", className: "vadim", images: { default: vadimImage } },
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
