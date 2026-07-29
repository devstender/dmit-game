# Глава 2: последняя школа

`chapter.quest` — манифест второй главы. Он подключает `part-1.quest`,
`part-2.quest` и все будущие файлы из `branches/`.

Порядок работы:

1. Пишите основную линию в отдельном `*.quest`, а альтернативные последствия —
   в отдельном файле `branches/*.quest`.
2. Проверяйте структуру, персонажей, фоны и переходы:

   ```powershell
   npm run quest:check -- src/chapters/chapter-2/last-school/chapter.quest
   ```

3. Собирайте TypeScript-сцены для игры:

   ```powershell
   npm run quest:chapter-2
   ```

4. Не редактируйте `chapter.generated.ts` вручную: он всегда пересоздаётся из
   сценарного текста. В приложении используйте экспорт из `scenes.ts`.

Связь между частями задаётся обычным `@next`: первая часть заканчивается на
`@next matvey-corridor-start`, а этот узел начинается в `part-2.quest`.
Когда появится продолжение уроков, добавьте его в `chapter.quest` через
`@include`; команду сборки менять не понадобится.

## Последствия без правки старой линии

В основной линии оставляется точка подключения:

```text
::hook morning-alcohol-recap
@fallback morning-alcohol-beer
@continue morning-black-phone
::end
```

Новая ветка лежит в отдельном файле из `branches/`:

```text
::extend morning-alcohol-recap
@when CHAPTER_1_ALCOHOL_HEAVY
@unless MAFIA_CONTACT_ALERTED
@priority 100
@start morning-alcohol-heavy
::end

::dialogue morning-alcohol-heavy
Рассказчик: Дмиту явно не стоило брать вторую бутылку.
@next morning-alcohol-recap-exit
::end
```

Поддерживаются `@when`, `@when-all`, `@when-any`, `@unless` и `@priority`.
При совпадении нескольких веток выбирается ветка с наибольшим приоритетом;
без совпадений запускается `@fallback`. Узел `<hook-id>-exit` создаётся
автоматически и ведёт в `@continue`.

Чтобы добавить вариант в существующий выбор, используйте отдельный файл:

```text
::extend-choice matvey-corridor-choice
@when CHAPTER_1_MATVEY_HUMILIATED_DMIT
@position 1

- Не спорить и уйти.
  -> matvey-submit-again
::end
```

Такой вариант скрыт, пока условный флаг отсутствует. `@position 1` вставляет
его после первого стандартного варианта.
