import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { supabase } from "../services/supabase";

interface WordPair {
  value: string;
  translation: string;
}

interface GameAnswer {
  translation: string;
  isCorrect: boolean;
}

interface ClickResult {
  translation: string;
  isCorrect: boolean;
}

// Функция для сохранения статистики
const saveGameStatistics = async (userId: string, wordsCount: number) => {
  try {
    const { error } = await supabase.from("statistic").insert([
      {
        words_count: wordsCount,
        created_at: new Date().toISOString(),
        user_id: userId,
      },
    ]);

    if (error) {
      console.error("Error saving game statistics:", error);
    } else {
      console.log("Game statistics saved successfully");
    }
  } catch (error) {
    console.error("Error saving game statistics:", error);
  }
};

const WordListPage: React.FC = () => {
  const { listName: encodedListName } = useParams<{ listName: string }>();
  const { user } = useAppSelector((state) => state.auth);

  const [actualListName, setActualListName] = useState<string>("");
  const [wordPairs, setWordPairs] = useState<WordPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Игровые состояния
  const [studiedPairs, setStudiedPairs] = useState<Set<number>>(new Set());
  const [currentPairIndex, setCurrentPairIndex] = useState<number>(0);
  const [gameAnswers, setGameAnswers] = useState<GameAnswer[]>([]);
  const [lastClickResult, setLastClickResult] = useState<ClickResult | null>(
    null
  );
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isHelpActive, setIsHelpActive] = useState(false);

  // Состояния для второго, третьего и четвертого шага игры
  const [gameStep, setGameStep] = useState<1 | 2 | 3 | 4>(1); // 1 = угадываем value (первый шаг), 2 = угадываем translation (второй шаг), 3 = вводим value по буквам (третий шаг), 4 = вводим value текстом (четвертый шаг)
  const [step2StudiedPairs, setStep2StudiedPairs] = useState<Set<number>>(
    new Set()
  );
  const [step3StudiedPairs, setStep3StudiedPairs] = useState<Set<number>>(
    new Set()
  );
  const [step4StudiedPairs, setStep4StudiedPairs] = useState<Set<number>>(
    new Set()
  );

  // Состояния для третьего шага (ввод по буквам)
  const [inputSlots, setInputSlots] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [hasError, setHasError] = useState(false);
  const [errorSlotIndex, setErrorSlotIndex] = useState<number>(-1);
  const [highlightedLetterIndex, setHighlightedLetterIndex] =
    useState<number>(-1);

  // Состояния для четвертого шага (ввод текста)
  const [textInput, setTextInput] = useState<string>("");
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<boolean>(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showNextButton, setShowNextButton] = useState<boolean>(false);
  const [inputHighlight, setInputHighlight] = useState<
    "correct" | "incorrect" | null
  >(null);

  // Ref для автофокуса инпута на четвертом шаге
  const textInputRef = useRef<HTMLInputElement>(null);

  // Функция поиска списка по закодированному имени (аналогично EditListPage)
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

  // Функция для получения 3 случайных неправильных ответов (translation или value)
  const getRandomIncorrectAnswers = useCallback(
    (
      allPairs: WordPair[],
      correctAnswer: string,
      answerType: "translation" | "value",
      count: number = 3
    ): string[] => {
      const incorrectAnswers = allPairs
        .map((pair) =>
          answerType === "translation" ? pair.translation : pair.value
        )
        .filter((answer) => answer !== correctAnswer);

      const shuffled = [...incorrectAnswers].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    },
    []
  );

  // Функция для создания вариантов ответа
  const createGameAnswers = useCallback(
    (
      correctPair: WordPair,
      allPairs: WordPair[],
      step: 1 | 2 | 3 | 4
    ): GameAnswer[] => {
      // Для третьего и четвертого шага не нужны варианты ответа
      if (step === 3 || step === 4) {
        return [];
      }

      // Шаг 1: Обратный перевод (показываем перевод, ищем слово)
      // Шаг 2: Прямой перевод (показываем слово, ищем перевод)
      const answerType = step === 1 ? "value" : "translation";
      const correctAnswer =
        step === 1 ? correctPair.value : correctPair.translation;

      const incorrectAnswers = getRandomIncorrectAnswers(
        allPairs,
        correctAnswer,
        answerType
      );

      const answers: GameAnswer[] = [
        { translation: correctAnswer, isCorrect: true },
        ...incorrectAnswers.map((answer) => ({
          translation: answer,
          isCorrect: false,
        })),
      ];

      // Перемешиваем массив ответов
      return answers.sort(() => Math.random() - 0.5);
    },
    [getRandomIncorrectAnswers]
  );

  // Функция для получения следующей неизученной пары
  const getNextUnstudiedPair = useCallback(
    (currentStudiedPairs?: Set<number>): number => {
      const actualStudiedPairs = currentStudiedPairs || studiedPairs;
      const unstudiedIndices = wordPairs
        .map((_, index) => index)
        .filter((index) => !actualStudiedPairs.has(index));

      if (unstudiedIndices.length === 0) return -1;

      const randomIndex = Math.floor(Math.random() * unstudiedIndices.length);
      return unstudiedIndices[randomIndex];
    },
    [wordPairs, studiedPairs]
  );

  // Функция для получения следующей неизученной пары, исключая текущую
  const getNextUnstudiedPairExcludingCurrent = useCallback(
    (excludeIndex: number, currentStudiedPairs?: Set<number>): number => {
      const actualStudiedPairs = currentStudiedPairs || studiedPairs;
      const unstudiedIndices = wordPairs
        .map((_, index) => index)
        .filter(
          (index) => !actualStudiedPairs.has(index) && index !== excludeIndex
        );

      if (unstudiedIndices.length === 0) {
        // Если нет других неизученных пар, возвращаем случайную неизученную (включая текущую)
        return getNextUnstudiedPair(actualStudiedPairs);
      }

      const randomIndex = Math.floor(Math.random() * unstudiedIndices.length);
      return unstudiedIndices[randomIndex];
    },
    [wordPairs, studiedPairs, getNextUnstudiedPair]
  );

  // Функции для третьего шага (ввод по буквам)
  const initializeStep3 = useCallback((wordPair: WordPair) => {
    const word = wordPair.value.toLowerCase();
    const slots: string[] = [];
    const letters: string[] = [];

    for (const char of word) {
      if (char === " " || char === "-") {
        slots.push(char);
      } else {
        slots.push("");
        letters.push(char);
      }
    }

    // Перемешиваем буквы
    const shuffledLetters = [...letters].sort(() => Math.random() - 0.5);

    setInputSlots(slots);
    setAvailableLetters(shuffledLetters);
    setHasError(false);
    setErrorSlotIndex(-1);
  }, []);

  // Инициализация четвертого шага
  const initializeStep4 = useCallback(() => {
    setTextInput("");
    setShowCorrectAnswer(false);
    setIsAnswerCorrect(null);
    setShowNextButton(false);
    setInputHighlight(null);
  }, []);

  const handleLetterClick = useCallback(
    (letter: string) => {
      const currentWord = wordPairs[currentPairIndex].value.toLowerCase();
      const nextEmptySlotIndex = inputSlots.findIndex((slot) => slot === "");

      if (nextEmptySlotIndex === -1) return; // Все слоты заполнены

      const expectedLetter = currentWord[nextEmptySlotIndex];

      if (letter === expectedLetter) {
        // Правильная буква
        const newSlots = [...inputSlots];
        newSlots[nextEmptySlotIndex] = letter;
        setInputSlots(newSlots);

        // Убираем букву из доступных
        const newAvailableLetters = [...availableLetters];
        const letterIndex = newAvailableLetters.indexOf(letter);
        if (letterIndex > -1) {
          newAvailableLetters.splice(letterIndex, 1);
          setAvailableLetters(newAvailableLetters);
        }

        // Проверяем, заполнены ли все слоты
        if (newSlots.every((slot) => slot !== "")) {
          // Слово собрано
          setTimeout(() => {
            if (!hasError) {
              // Без ошибок - помечаем как изученное
              console.log(
                "Step 3: Word completed without errors, marking as studied"
              );
              console.log("Current pair index:", currentPairIndex);
              setStep3StudiedPairs((prevStudiedPairs) => {
                const newStudiedPairs = new Set(prevStudiedPairs);
                newStudiedPairs.add(currentPairIndex);
                console.log("Updated step3 studied pairs:", newStudiedPairs);

                // Проверяем, все ли пары изучены
                if (newStudiedPairs.size === wordPairs.length) {
                  // Переходим к четвертому шагу
                  setGameStep(4);
                  setStep4StudiedPairs(new Set());

                  setTimeout(() => {
                    const firstIndex = Math.floor(
                      Math.random() * wordPairs.length
                    );
                    setCurrentPairIndex(firstIndex);
                    setGameAnswers([]);
                    initializeStep4();
                    setLastClickResult(null);
                  }, 1000);

                  return newStudiedPairs;
                }

                // Переходим к следующей неизученной паре
                setTimeout(() => {
                  const nextIndex = getNextUnstudiedPair(newStudiedPairs);
                  console.log(
                    "Next index after successful completion:",
                    nextIndex
                  );
                  if (nextIndex !== -1) {
                    setCurrentPairIndex(nextIndex);
                    initializeStep3(wordPairs[nextIndex]);
                  }
                }, 100);

                return newStudiedPairs;
              });
            } else {
              // С ошибками - переходим к другой паре, исключая текущую
              console.log(
                "Step 3: Word completed with errors, current pair stays unstudied"
              );
              console.log("Current pair index:", currentPairIndex);
              console.log("Step3 studied pairs:", step3StudiedPairs);
              setTimeout(() => {
                const nextIndex = getNextUnstudiedPairExcludingCurrent(
                  currentPairIndex,
                  step3StudiedPairs
                );
                console.log("Next index to study:", nextIndex);
                if (nextIndex !== -1) {
                  setCurrentPairIndex(nextIndex);
                  initializeStep3(wordPairs[nextIndex]);
                }
              }, 100);
            }
          }, 1000);
        }
      } else {
        // Неправильная буква
        console.log("Step 3: Wrong letter selected, setting error flag");
        console.log(
          "Expected letter:",
          currentWord[nextEmptySlotIndex],
          "Selected letter:",
          letter
        );
        setHasError(true);
        setErrorSlotIndex(nextEmptySlotIndex);

        // Убираем подсветку ошибки через полсекунды
        setTimeout(() => {
          setErrorSlotIndex(-1);
        }, 500);
      }
    },
    [
      inputSlots,
      availableLetters,
      currentPairIndex,
      wordPairs,
      hasError,
      step3StudiedPairs,
      getNextUnstudiedPair,
      getNextUnstudiedPairExcludingCurrent,
      initializeStep3,
      initializeStep4,
    ]
  );

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (gameStep !== 3) return;

      const letter = event.key.toLowerCase();
      if (availableLetters.includes(letter)) {
        handleLetterClick(letter);
      }
    },
    [gameStep, availableLetters, handleLetterClick]
  );

  // Обработка клавиатуры для третьего шага
  useEffect(() => {
    if (gameStep === 3) {
      window.addEventListener("keydown", handleKeyPress);
    }
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameStep, handleKeyPress]);

  // Автофокус инпута на четвертом шаге при смене пар
  useEffect(() => {
    if (gameStep === 4 && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [gameStep, currentPairIndex]);

  // Функции для четвертого шага (ввод текста)
  const handleTextSubmit = useCallback(() => {
    if (!wordPairs[currentPairIndex]) return;

    const correctAnswer = wordPairs[currentPairIndex].value
      .toLowerCase()
      .trim();
    const userAnswer = textInput.toLowerCase().trim();
    const isCorrect = userAnswer === correctAnswer;

    setIsAnswerCorrect(isCorrect);

    if (isCorrect) {
      // Правильный ответ - подсвечиваем зеленым на полсекунды
      setInputHighlight("correct");

      // Сбрасываем зеленую подсветку через полсекунды
      setTimeout(() => {
        setInputHighlight(null);
      }, 500);

      // Добавляем в изученные и переходим к следующей паре
      setStep4StudiedPairs((prev) => new Set([...prev, currentPairIndex]));

      // Проверяем, изучены ли все пары
      if (step4StudiedPairs.size + 1 >= wordPairs.length) {
        // Все пары изучены - игра завершена
        setTimeout(async () => {
          // Сохраняем статистику в Supabase
          if (user?.id) {
            await saveGameStatistics(user.id, wordPairs.length);
          }
          setGameCompleted(true);
        }, 500);
      } else {
        // Ищем следующую неизученную пару
        setTimeout(() => {
          const nextIndex = getNextUnstudiedPairExcludingCurrent(
            currentPairIndex,
            step4StudiedPairs
          );
          if (nextIndex !== -1) {
            setCurrentPairIndex(nextIndex);
            initializeStep4();
          }
        }, 500);
      }
    } else {
      // Неправильный ответ - подсвечиваем красным и показываем правильный ответ
      setInputHighlight("incorrect");
      setShowCorrectAnswer(true);
      setShowNextButton(true);
    }
  }, [
    textInput,
    wordPairs,
    currentPairIndex,
    step4StudiedPairs,
    getNextUnstudiedPairExcludingCurrent,
    initializeStep4,
    user,
  ]);

  const handleStep4Next = useCallback(() => {
    // Сбрасываем подсветку перед переходом к следующей паре
    setInputHighlight(null);

    // Ищем следующую неизученную пару (текущая остается неизученной)
    const nextIndex = getNextUnstudiedPairExcludingCurrent(
      currentPairIndex,
      step4StudiedPairs
    );
    if (nextIndex !== -1) {
      setCurrentPairIndex(nextIndex);
      initializeStep4();
    }
  }, [
    currentPairIndex,
    step4StudiedPairs,
    getNextUnstudiedPairExcludingCurrent,
    initializeStep4,
  ]);

  // Функция для обработки клика по варианту ответа
  const handleAnswerClick = useCallback(
    (answer: GameAnswer) => {
      setLastClickResult({
        translation: answer.translation,
        isCorrect: answer.isCorrect,
      });

      if (answer.isCorrect) {
        // Определяем текущий набор изученных пар
        const setCurrentStudiedPairs =
          gameStep === 1 ? setStudiedPairs : setStep2StudiedPairs;

        // Помечаем текущую пару как изученную используя функциональное обновление
        setCurrentStudiedPairs((prevStudiedPairs) => {
          const newStudiedPairs = new Set(prevStudiedPairs);
          newStudiedPairs.add(currentPairIndex);

          // Проверяем, все ли пары изучены на текущем шаге
          if (newStudiedPairs.size === wordPairs.length) {
            if (gameStep === 1) {
              // Переходим ко второму шагу (прямой перевод)
              setGameStep(2);
              setStep2StudiedPairs(new Set());

              setTimeout(() => {
                const firstIndex = Math.floor(Math.random() * wordPairs.length);
                setCurrentPairIndex(firstIndex);
                setGameAnswers(
                  createGameAnswers(wordPairs[firstIndex], wordPairs, 2)
                );
                setLastClickResult(null);
              }, 1000);
            } else if (gameStep === 2) {
              // Переходим к третьему шагу (ввод по буквам)
              setGameStep(3);
              setStep3StudiedPairs(new Set());

              setTimeout(() => {
                const firstIndex = Math.floor(Math.random() * wordPairs.length);
                setCurrentPairIndex(firstIndex);
                setGameAnswers([]);
                initializeStep3(wordPairs[firstIndex]);
                setLastClickResult(null);
              }, 1000);
            } else if (gameStep === 3) {
              // Переходим к четвертому шагу (ввод текста)
              setGameStep(4);
              setStep4StudiedPairs(new Set());

              setTimeout(() => {
                const firstIndex = Math.floor(Math.random() * wordPairs.length);
                setCurrentPairIndex(firstIndex);
                setGameAnswers([]);
                initializeStep4();
                setLastClickResult(null);
              }, 1000);
            } else {
              // Игра завершена
              setGameCompleted(true);
            }
            return newStudiedPairs;
          }

          // Для правильного ответа переходим к любой следующей неизученной паре
          setTimeout(() => {
            const nextIndex = getNextUnstudiedPair(newStudiedPairs);
            if (nextIndex !== -1) {
              setCurrentPairIndex(nextIndex);
              setGameAnswers(
                createGameAnswers(wordPairs[nextIndex], wordPairs, gameStep)
              );
            }
            setLastClickResult(null);
          }, 1000);

          return newStudiedPairs;
        });
      } else {
        // Для неправильного ответа переходим к другой паре, исключая текущую
        const currentStudiedPairs =
          gameStep === 1 ? studiedPairs : step2StudiedPairs;

        setTimeout(() => {
          const nextIndex = getNextUnstudiedPairExcludingCurrent(
            currentPairIndex,
            currentStudiedPairs
          );
          if (nextIndex !== -1) {
            setCurrentPairIndex(nextIndex);
            setGameAnswers(
              createGameAnswers(wordPairs[nextIndex], wordPairs, gameStep)
            );
          }
          setLastClickResult(null);
        }, 1000);
      }
    },
    [
      studiedPairs,
      step2StudiedPairs,
      currentPairIndex,
      wordPairs,
      gameStep,
      getNextUnstudiedPair,
      getNextUnstudiedPairExcludingCurrent,
      createGameAnswers,
      initializeStep3,
      initializeStep4,
    ]
  );

  // Функция для начала игры
  const startGame = useCallback(() => {
    if (wordPairs.length === 0) return;

    setIsGameStarted(true);
    setGameStep(1); // Начинаем с первого шага
    setStudiedPairs(new Set());
    setStep2StudiedPairs(new Set());
    setStep3StudiedPairs(new Set());
    setStep4StudiedPairs(new Set());
    setGameCompleted(false);

    const firstIndex = Math.floor(Math.random() * wordPairs.length);
    setCurrentPairIndex(firstIndex);
    setGameAnswers(createGameAnswers(wordPairs[firstIndex], wordPairs, 1));
  }, [wordPairs, createGameAnswers]);

  // Функция для обработки кнопки Help
  const handleHelpClick = useCallback(() => {
    if (isHelpActive || lastClickResult !== null) return; // Предотвращаем повторные клики

    setIsHelpActive(true);

    // Через полсекунды убираем подсветку
    setTimeout(() => {
      setIsHelpActive(false);
    }, 500);
  }, [isHelpActive, lastClickResult]);

  // Функция для обработки кнопки Help на третьем шаге
  const handleStep3HelpClick = useCallback(() => {
    if (gameStep !== 3 || isHelpActive) return;

    // Находим первый пустой слот
    const nextEmptySlotIndex = inputSlots.findIndex((slot) => slot === "");
    if (nextEmptySlotIndex === -1) return; // Все слоты заполнены

    // Находим правильную букву для этого слота
    const currentWord = wordPairs[currentPairIndex].value.toLowerCase();
    const correctLetter = currentWord[nextEmptySlotIndex];

    // Находим индекс этой буквы в доступных буквах
    const letterIndex = availableLetters.findIndex(
      (letter) => letter === correctLetter
    );
    if (letterIndex === -1) return; // Буква не найдена

    setIsHelpActive(true);
    setHighlightedLetterIndex(letterIndex);

    // Через полсекунды убираем подсветку
    setTimeout(() => {
      setIsHelpActive(false);
      setHighlightedLetterIndex(-1);
    }, 500);
  }, [
    gameStep,
    isHelpActive,
    inputSlots,
    wordPairs,
    currentPairIndex,
    availableLetters,
  ]);

  useEffect(() => {
    const loadListData = async () => {
      if (!encodedListName || !user) return;

      try {
        setIsLoading(true);

        // Получаем все записи пользователя
        const { data, error } = await supabase
          .from("words")
          .select("*")
          .eq("user_id", user.id)
          .order("list_name");

        if (error) throw error;

        if (!data || data.length === 0) {
          setError("Списки не найдены");
          return;
        }

        // Получаем все уникальные имена списков
        const uniqueListNames = [
          ...new Set(data.map((record) => record.list_name)),
        ];

        // Ищем наиболее подходящий список
        const foundListName = findListByEncodedName(
          uniqueListNames,
          encodedListName
        );

        if (foundListName) {
          setActualListName(foundListName);

          // Фильтруем записи для этого конкретного списка
          const listRecords =
            data?.filter((record) => record.list_name === foundListName) || [];

          // Преобразуем в пары слов
          const pairs: WordPair[] = listRecords.map((record) => ({
            value: record.value || "",
            translation: record.translation || "",
          }));

          setWordPairs(pairs);
        } else {
          setError("Список не найден");
        }
      } catch (error) {
        console.error("Error loading list data:", error);
        setError("Ошибка при загрузке данных списка");
      } finally {
        setIsLoading(false);
      }
    };

    loadListData();
  }, [encodedListName, user]);

  // Автоматический запуск игры после загрузки данных
  useEffect(() => {
    if (wordPairs.length > 0 && !isGameStarted && !isLoading) {
      startGame();
    }
  }, [wordPairs, isGameStarted, isLoading, startGame]);

  if (isLoading) {
    return (
      <div className="word-list-page">
        <div className="fun-card">
          <h2>🔄 Загружаем игру...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="word-list-page">
        <div className="fun-card">
          <h2>❌ Ошибка</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (wordPairs.length === 0) {
    return (
      <div className="word-list-page">
        <div className="fun-card">
          <h2>📚 Список пуст</h2>
          <p>В этом списке пока нет слов для изучения</p>
        </div>
      </div>
    );
  }

  if (gameCompleted) {
    return (
      <div className="word-list-page">
        <div className="fun-card game-completion">
          <h1 className="super-title">🎉 Ты - супер! 🎉</h1>
          <div className="dancing-cat">
            <img src="/CAT.png" alt="Dancing cat" className="cat-image" />
          </div>
        </div>
      </div>
    );
  }

  if (!isGameStarted) {
    return (
      <div className="word-list-page">
        <div className="fun-card">
          <h2>🎮 Готовы к игре?</h2>
          <p>
            Список: {actualListName} ({wordPairs.length} слов)
          </p>
          <button onClick={startGame} className="game-start-btn">
            ▶️ Начать игру
          </button>
        </div>
      </div>
    );
  }

  const currentPair = wordPairs[currentPairIndex];

  return (
    <div className="word-list-page">
      <div className="game-container">
        <div className="game-header">
          <h2>🎮 {actualListName}</h2>
          <div className="game-step-info">Шаг {gameStep} из 4</div>
          <div className="game-progress">
            Изучено:{" "}
            {(() => {
              if (gameStep === 1) return studiedPairs.size;
              if (gameStep === 2) return step2StudiedPairs.size;
              if (gameStep === 3) return step3StudiedPairs.size;
              return step4StudiedPairs.size;
            })()}{" "}
            / {wordPairs.length}
          </div>
        </div>

        {gameStep === 3 ? (
          // Третий шаг: ввод по буквам
          <div>
            <div className="game-word-display">
              <div className="current-word">{currentPair.translation}</div>
              <div className="game-instruction">Введите слово по буквам:</div>
              <button
                className="help-btn"
                onClick={handleStep3HelpClick}
                disabled={isHelpActive}
                title="Показать правильную букву"
              >
                💡 Help
              </button>
            </div>

            {/* Слоты для букв */}
            <div className="input-slots">
              {inputSlots.map((slot, index) => (
                <div
                  key={`slot-${currentPairIndex}-${index}`}
                  className={`input-slot ${slot === "" ? "empty" : "filled"} ${
                    errorSlotIndex === index ? "error" : ""
                  }`}
                >
                  {slot}
                </div>
              ))}
            </div>

            {/* Доступные буквы */}
            <div className="available-letters">
              {availableLetters.map((letter, index) => (
                <button
                  key={`${letter}-${index}`}
                  className={`letter-btn ${
                    highlightedLetterIndex === index ? "help-highlight" : ""
                  }`}
                  onClick={() => handleLetterClick(letter)}
                >
                  {letter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ) : gameStep === 4 ? (
          // Четвертый шаг: ввод текста
          <div>
            <div className="game-word-display">
              <div className="current-word">{currentPair.translation}</div>
              <div className="game-instruction">Введите слово:</div>
              <button
                className="help-btn"
                onClick={() => {
                  setShowCorrectAnswer(true);
                  setTimeout(() => setShowCorrectAnswer(false), 4000);
                }}
                title="Показать правильный ответ"
              >
                💡 Help
              </button>
            </div>

            {/* Поле ввода текста */}
            <div className="text-input-container">
              <input
                ref={textInputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className={`text-input ${
                  inputHighlight === "correct" ? "input-correct" : ""
                } ${inputHighlight === "incorrect" ? "input-incorrect" : ""}`}
                placeholder="Введите слово..."
                disabled={showCorrectAnswer && isAnswerCorrect === false}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !showNextButton) {
                    handleTextSubmit();
                  }
                }}
              />

              {showCorrectAnswer && isAnswerCorrect === false && (
                <div className="correct-answer-display">
                  Правильный ответ: {wordPairs[currentPairIndex]?.value}
                </div>
              )}

              <button
                className="game-answer-btn"
                onClick={showNextButton ? handleStep4Next : handleTextSubmit}
                disabled={!textInput.trim() && !showNextButton}
              >
                {showNextButton ? "Далее" : "Ответить"}
              </button>
            </div>
          </div>
        ) : (
          // Первый и второй шаги: выбор из вариантов
          <div>
            <div className="game-word-display">
              <div className="current-word">
                {gameStep === 1 ? currentPair.translation : currentPair.value}
              </div>
              <div className="game-instruction">
                {gameStep === 1
                  ? "Выберите правильное слово:"
                  : "Выберите правильный перевод:"}
              </div>
              <button
                className="help-btn"
                onClick={handleHelpClick}
                disabled={isHelpActive || lastClickResult !== null}
                title="Показать правильный ответ"
              >
                💡 Help
              </button>
            </div>

            <div className="game-answers-grid">
              {gameAnswers.map((answer, index) => {
                let buttonClass = "game-answer-btn";

                // Подсветка при результате клика
                if (lastClickResult?.translation === answer.translation) {
                  buttonClass += lastClickResult.isCorrect
                    ? " correct"
                    : " incorrect";
                }

                // Подсветка правильного ответа при Help
                if (isHelpActive && answer.isCorrect) {
                  buttonClass += " help-highlight";
                }

                return (
                  <button
                    key={`${answer.translation}-${index}`}
                    className={buttonClass}
                    onClick={() => handleAnswerClick(answer)}
                    disabled={lastClickResult !== null || isHelpActive}
                  >
                    {answer.translation}
                  </button>
                );
              })}
            </div>

            {lastClickResult && (
              <div
                className={`game-feedback ${
                  lastClickResult.isCorrect ? "success" : "error"
                }`}
              >
                {lastClickResult.isCorrect
                  ? "✅ Правильно!"
                  : "❌ Неправильно, попробуйте еще раз"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WordListPage;
