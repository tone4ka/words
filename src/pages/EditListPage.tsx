import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchWordListsRequest } from "../store/slices/wordsSlice";
import { supabase } from "../services/supabase";

interface WordPair {
  id: string;
  word: string;
  translation: string;
  originalWord?: string; // Для отслеживания изменений
  originalTranslation?: string; // Для отслеживания изменений
}

interface ValidationErrors {
  listName?: string;
  wordPairs?: string;
  general?: string;
}

interface DatabaseRecord {
  user_id: string;
  list_name: string;
  value: string;
  translation: string;
}

const EditListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { listName: encodedListName } = useParams<{ listName: string }>();
  const { user } = useAppSelector((state) => state.auth);

  const [originalListName, setOriginalListName] = useState("");
  const [listName, setListName] = useState("");
  const [wordPairs, setWordPairs] = useState<WordPair[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Функция поиска списка по закодированному имени
  const findListByEncodedName = (
    uniqueListNames: string[],
    encodedName: string
  ): string | null => {
    const decodedSearchTerm = encodedName
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .toLowerCase();

    // 1. Точное совпадение
    let found = uniqueListNames.find(
      (name) => name.toLowerCase() === decodedSearchTerm
    );
    if (found) return found;

    // 2. Частичное совпадение
    found = uniqueListNames.find((name) => {
      const normalizedName = name.toLowerCase();
      return (
        normalizedName.includes(decodedSearchTerm) ||
        decodedSearchTerm.includes(normalizedName)
      );
    });
    if (found) return found;

    // 3. Поиск по словам
    const searchWords = decodedSearchTerm
      .split(" ")
      .filter((word) => word.length > 0);
    for (const listName of uniqueListNames) {
      const nameWords = listName.toLowerCase().split(" ");
      const hasMatch = searchWords.some((searchWord: string) =>
        nameWords.some((nameWord: string) => nameWord.includes(searchWord))
      );
      if (hasMatch) return listName;
    }

    return null;
  };

  // Загружаем данные списка при монтировании компонента
  useEffect(() => {
    const loadListData = async () => {
      if (!encodedListName || !user) return;

      try {
        setIsInitialLoading(true);

        // Получаем все записи пользователя
        const { data, error } = await supabase
          .from("words")
          .select("*")
          .eq("user_id", user.id)
          .order("list_name");

        if (error) throw error;

        if (!data || data.length === 0) {
          setErrors({ general: "Списки не найдены" });
          return;
        }

        // Получаем все уникальные имена списков
        const uniqueListNames = [
          ...new Set(data.map((record) => record.list_name)),
        ];

        console.log("Debug: Encoded list name from URL:", encodedListName);
        console.log("Debug: Available list names:", uniqueListNames);

        // Ищем наиболее подходящий список
        const actualListName = findListByEncodedName(
          uniqueListNames,
          encodedListName
        );

        console.log("Debug: Found list name:", actualListName);

        if (actualListName) {
          setOriginalListName(actualListName);
          setListName(actualListName);

          // Фильтруем записи для этого конкретного списка
          const listRecords =
            data?.filter((record) => record.list_name === actualListName) || [];

          // Преобразуем в пары слов
          const pairs: WordPair[] = listRecords.map((record, index) => ({
            id: `pair-${index}`,
            word: record.value || "",
            translation: record.translation || "",
            originalWord: record.value || "",
            originalTranslation: record.translation || "",
          }));

          // Добавляем пустые пары до минимум 5, если нужно
          while (pairs.length < 5) {
            pairs.push({
              id: `pair-${pairs.length}`,
              word: "",
              translation: "",
              originalWord: "",
              originalTranslation: "",
            });
          }

          setWordPairs(pairs);
        } else {
          // Список не найден
          setErrors({ general: "Список не найден" });
        }
      } catch (error) {
        console.error("Error loading list data:", error);
        setErrors({ general: "Ошибка при загрузке данных списка" });
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadListData();
  }, [encodedListName, user]);

  const handleWordPairChange = (
    index: number,
    field: "word" | "translation",
    value: string
  ) => {
    const newWordPairs = [...wordPairs];
    newWordPairs[index][field] = value;
    setWordPairs(newWordPairs);
  };

  const addNewWordPair = () => {
    const newPair: WordPair = {
      id: `pair-${wordPairs.length}`,
      word: "",
      translation: "",
      originalWord: "",
      originalTranslation: "",
    };
    setWordPairs([...wordPairs, newPair]);
  };

  // Функция для проверки дубликатов слов
  const getDuplicateWords = (): Set<string> => {
    const words = wordPairs
      .filter((pair) => pair.word.trim())
      .map((pair) => pair.word.trim().toLowerCase());

    const wordCounts = new Map<string, number>();
    words.forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    return new Set(
      Array.from(wordCounts.entries())
        .filter(([, count]) => count > 1)
        .map(([word]) => word)
    );
  };

  const duplicateWords = getDuplicateWords();

  const validateForm = async (): Promise<boolean> => {
    const newErrors: ValidationErrors = {};

    // Проверка 1: Проверка существования списка с таким именем (только если имя изменилось)
    if (!listName.trim()) {
      newErrors.listName = "Введите имя списка";
    } else {
      // Проверка допустимых символов (только латинские буквы, цифры, пробелы и дефисы)
      const allowedCharsRegex = /^[a-zA-Z0-9\s-]+$/;
      if (!allowedCharsRegex.test(listName.trim())) {
        newErrors.listName =
          "Имя списка может содержать только латинские буквы, цифры, пробелы и дефисы";
      } else if (listName.trim() !== originalListName) {
        try {
          const { data, error } = await supabase
            .from("words")
            .select("list_name")
            .eq("list_name", listName.trim())
            .limit(1);

          if (error) throw error;

          if (data && data.length > 0) {
            newErrors.listName = "Список с таким именем уже существует";
          }
        } catch (error) {
          console.error("Error checking list name:", error);
          newErrors.general = "Ошибка при проверке имени списка";
        }
      }
    }

    // Проверка 2: Неполные пары (заполнен только один инпут)
    const incompletePairs = wordPairs.filter(
      (pair) =>
        (pair.word.trim() && !pair.translation.trim()) ||
        (!pair.word.trim() && pair.translation.trim())
    );

    if (incompletePairs.length > 0) {
      newErrors.wordPairs =
        "Все пары должны быть заполнены полностью (и слово, и перевод)";
    }

    // Проверка 3: Минимум 4 пары слов
    const filledPairs = wordPairs.filter(
      (pair) => pair.word.trim() && pair.translation.trim()
    );

    if (filledPairs.length < 4 && !newErrors.wordPairs) {
      newErrors.wordPairs = "Введите минимум 4 пары слов с переводом";
    }

    // Проверка 4: Дублирующиеся слова
    const words = filledPairs.map((pair) => pair.word.trim().toLowerCase());
    const uniqueWords = new Set(words);

    if (words.length !== uniqueWords.size && !newErrors.wordPairs) {
      newErrors.wordPairs =
        "Обнаружены повторяющиеся слова. Каждое слово должно быть уникальным";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setIsLoading(true);
    setErrors({});

    try {
      const isValid = await validateForm();
      if (!isValid) return;

      await updateWordList();

      // Обновляем список слов в Redux
      dispatch(fetchWordListsRequest());

      // Переходим назад к списку
      navigate("/word-lists");
    } catch (error) {
      console.error("Error updating word list:", error);
      setErrors({ general: "Ошибка при сохранении списка" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateWordList = async () => {
    if (!user) return;

    // Получаем все текущие записи для оригинального списка
    const { data: existingRecords, error: fetchError } = await supabase
      .from("words")
      .select("*")
      .eq("user_id", user.id)
      .eq("list_name", originalListName);

    if (fetchError) throw fetchError;

    const filledPairs = wordPairs.filter(
      (pair) => pair.word.trim() && pair.translation.trim()
    );

    // Удаляем очищенные записи
    await deleteEmptyPairs(existingRecords);

    // Обновляем/создаем записи для заполненных пар
    await updateFilledPairs(filledPairs, existingRecords);
  };

  const deleteEmptyPairs = async (existingRecords: DatabaseRecord[]) => {
    const pairsToDelete = wordPairs.filter(
      (pair) =>
        (pair.originalWord?.trim() || pair.originalTranslation?.trim()) &&
        (!pair.word.trim() || !pair.translation.trim())
    );

    for (const pair of pairsToDelete) {
      if (pair.originalWord && pair.originalTranslation) {
        const recordToDelete = existingRecords?.find(
          (record) =>
            record.value === pair.originalWord &&
            record.translation === pair.originalTranslation
        );

        if (recordToDelete) {
          const { error: deleteError } = await supabase
            .from("words")
            .delete()
            .eq("user_id", user?.id)
            .eq("list_name", originalListName)
            .eq("value", pair.originalWord)
            .eq("translation", pair.originalTranslation);

          if (deleteError) throw deleteError;
        }
      }
    }
  };

  const updateFilledPairs = async (
    filledPairs: WordPair[],
    existingRecords: DatabaseRecord[]
  ) => {
    for (const pair of filledPairs) {
      if (pair.originalWord && pair.originalTranslation) {
        // Обновляем существующую запись
        await updateExistingRecord(pair, existingRecords);
      } else {
        // Создаем новую запись
        await createNewRecord(pair);
      }
    }
  };

  const updateExistingRecord = async (
    pair: WordPair,
    existingRecords: DatabaseRecord[]
  ) => {
    const recordToUpdate = existingRecords?.find(
      (record) =>
        record.value === pair.originalWord &&
        record.translation === pair.originalTranslation
    );

    if (recordToUpdate) {
      const { error: updateError } = await supabase
        .from("words")
        .update({
          list_name: listName.trim(),
          value: pair.word.trim(),
          translation: pair.translation.trim(),
        })
        .eq("user_id", user?.id)
        .eq("list_name", originalListName)
        .eq("value", pair.originalWord)
        .eq("translation", pair.originalTranslation);

      if (updateError) throw updateError;
    }
  };

  const createNewRecord = async (pair: WordPair) => {
    if (!user) return;

    const { error: insertError } = await supabase.from("words").insert({
      user_id: user.id,
      list_name: listName.trim(),
      value: pair.word.trim(),
      translation: pair.translation.trim(),
    });

    if (insertError) throw insertError;
  };

  const handleCancel = () => {
    navigate("/word-lists");
  };

  if (isInitialLoading) {
    return (
      <div className="create-list-container">
        <div className="loading-card">
          <h2>🔄 Загружаем данные списка...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-list-container">
      <div className="create-list-content">
        <div className="create-list-header">
          <h1>✏️ Редактирование списка</h1>
          <p>Измени слова и переводы в своем списке</p>
        </div>

        <form onSubmit={handleSubmit} className="create-list-form">
          {/* Поле имени списка */}
          <div className="create-list-form-group">
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Добавь имя списка слов"
              className={`list-name-input ${errors.listName ? "error" : ""}`}
              disabled={isLoading}
            />
            {errors.listName && (
              <div className="create-list-error-message">{errors.listName}</div>
            )}
          </div>

          {/* Пары слов */}
          <div className="word-pairs-section">
            <h3>💭 Слова и переводы</h3>
            <div className="word-pairs-grid">
              {wordPairs.map((pair, index) => {
                const isDuplicateWord =
                  pair.word.trim() &&
                  duplicateWords.has(pair.word.trim().toLowerCase());

                // Проверка неполных пар
                const isIncompleteWord =
                  pair.word.trim() && !pair.translation.trim();
                const isIncompleteTranslation =
                  !pair.word.trim() && pair.translation.trim();

                return (
                  <div key={pair.id} className="word-pair-row">
                    <span className="row-number">{index + 1}.</span>
                    <input
                      type="text"
                      value={pair.word}
                      onChange={(e) =>
                        handleWordPairChange(index, "word", e.target.value)
                      }
                      placeholder="Слово"
                      className={`word-input ${
                        isDuplicateWord ? "duplicate-error" : ""
                      } ${isIncompleteWord ? "incomplete-error" : ""}`}
                      disabled={isLoading}
                    />
                    <span className="separator">—</span>
                    <input
                      type="text"
                      value={pair.translation}
                      onChange={(e) =>
                        handleWordPairChange(
                          index,
                          "translation",
                          e.target.value
                        )
                      }
                      placeholder="Перевод"
                      className={`translation-input ${
                        isIncompleteTranslation ? "incomplete-error" : ""
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                );
              })}
            </div>
            {errors.wordPairs && (
              <div className="create-list-error-message">
                {errors.wordPairs}
              </div>
            )}

            {/* Кнопка добавления слова */}
            <div className="add-word-section">
              <button
                type="button"
                onClick={addNewWordPair}
                className="add-word-btn"
                disabled={isLoading}
              >
                ➕ Добавить слово
              </button>
            </div>
          </div>

          {/* Общие ошибки */}
          {errors.general && (
            <div className="create-list-error-message general-error">
              {errors.general}
            </div>
          )}

          {/* Кнопки */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-action-btn"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button type="submit" className="save-btn" disabled={isLoading}>
              {isLoading ? "⏳ Сохранение..." : "💾 Сохранить изменения"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListPage;
