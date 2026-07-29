# DmitScript

`*.quest` — текстовый формат поверх существующего Quest DSL. Он компилируется заранее, поэтому игра получает обычный `QuestDefinition`, а ошибки сценария не попадают в браузер.

```text
::dialogue morning
@bg school-yard-night
@cast Дмит | Мишган

Рассказчик: Утро начинается слишком рано.
Мишган: Уф-уф. Живой?
Дмит: Пока да.

@next answer
::end

::choice answer
@prompt Что сказать?
@cast Дмит | Мишган

- Нормально.
  -> finish
  +relation Мишган 1

- Отстань.
  ? Харизма 3
  -> finish
  !-> finish
::end

::dialogue finish
Рассказчик: Разговор закончен.
@end
::end
```

Поддерживаются `::dialogue`, `::phone`, `::route`, `::choice` и `::cosmetic`; директивы `@bg`, `@cast`, `@next`, `@end`, `@prompt`, `@continue`, `@contact`, `@time`, `@notify`, `@sound-next`, `@effect-next`, `@cast-next`, `@tone-next`, `@requires`, `@requires-all`, `@requires-any`.

```powershell
npm run quest:check -- src/chapters/chapter-2/scripts/morning.quest
npm run quest:build -- src/chapters/chapter-2/scripts/morning.quest
```

Для генерации в другой файл: `--out`, для задания ID квеста: `--id`, для начальной сцены: `--start`.
