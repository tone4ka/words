import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchWordListsRequest } from "../store/slices/wordsSlice";
import { supabase } from "../services/supabase";

interface WordPair {
  id: string;
  word: string;
  translation: string;
}

interface ValidationErrors {
  listName?: string;
  wordPairs?: string;
  general?: string;
}

const CreateListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [listName, setListName] = useState("");
  const [wordPairs, setWordPairs] = useState<WordPair[]>(
    Array.from({ length: 20 }, (_, index) => ({
      id: `pair-${index}`,
      word: "",
      translation: "",
    }))
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);

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
    };
    setWordPairs([...wordPairs, newPair]);
  };

  // Проверяем, заполнены ли все первые 20 пар
  const areFirst20PairsFilled = wordPairs
    .slice(0, 20)
    .every((pair) => pair.word.trim() && pair.translation.trim());

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

    // Проверка 1: Проверка существования списка с таким именем
    if (!listName.trim()) {
      newErrors.listName = "Введите имя списка";
    } else {
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

    if (!user) {
      setErrors({ general: "Пользователь не авторизован" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const isValid = await validateForm();
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      // Получаем только заполненные пары
      const filledPairs = wordPairs.filter(
        (pair) => pair.word.trim() && pair.translation.trim()
      );

      // Подготавливаем данные для вставки
      const wordsToInsert = filledPairs.map((pair) => ({
        list_name: listName.trim(),
        value: pair.word.trim(),
        translation: pair.translation.trim(),
        user_id: user.id,
      }));

      // Сохраняем в базу данных
      const { error } = await supabase.from("words").insert(wordsToInsert);

      if (error) throw error;

      // Обновляем список слов в store
      dispatch(fetchWordListsRequest());

      // Успешное сохранение - возвращаемся на дашборд
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving word list:", error);
      setErrors({ general: "Ошибка при сохранении списка слов" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  return (
    <div className="create-list-container">
      <div className="create-list-card">
        <div className="create-list-header">
          <h2>📝 Создать новый список слов</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="cancel-btn"
            disabled={isLoading}
          >
            ✕
          </button>
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
            {areFirst20PairsFilled && (
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
            )}
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
              {isLoading ? "⏳ Сохранение..." : "💾 Сохранить список"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListPage;
