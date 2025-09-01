import React, { useEffect, useRef, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchWordListsRequest,
  clearWordsError,
} from "../store/slices/wordsSlice";
import { encodeUrlSafe } from "../utils/urlSafe";
import { supabase } from "../services/supabase";

const WordListsContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { wordLists, loading, error, lastFetchTime } = useAppSelector(
    (state) => state.words
  );
  const { user } = useAppSelector((state) => state.auth);
  const hasFetchedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const [deletingLists, setDeletingLists] = useState<Set<string>>(new Set());

  const deleteWordList = async (listName: string) => {
    if (!user || deletingLists.has(listName)) return;

    if (!window.confirm(`Вы уверены, что хотите удалить список "${listName}"? Это действие нельзя отменить.`)) {
      return;
    }

    try {
      setDeletingLists(prev => new Set([...prev, listName]));

      const { error } = await supabase
        .from("words")
        .delete()
        .eq("user_id", user.id)
        .eq("list_name", listName);

      if (error) throw error;

      // Обновляем список после успешного удаления
      dispatch(fetchWordListsRequest());
    } catch (error) {
      console.error("Error deleting word list:", error);
      alert("Ошибка при удалении списка. Попробуйте еще раз.");
    } finally {
      setDeletingLists(prev => {
        const newSet = new Set(prev);
        newSet.delete(listName);
        return newSet;
      });
    }
  };

  const fetchWordLists = useCallback(() => {
    if (!user || loading || hasFetchedRef.current) return;

    // Если данные свежие (меньше 5 минут), не запрашиваем
    if (wordLists.length > 0 && lastFetchTime) {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (lastFetchTime >= fiveMinutesAgo) return;
    }

    hasFetchedRef.current = true;
    dispatch(fetchWordListsRequest());
  }, [dispatch, user, loading, wordLists.length, lastFetchTime]);

  useEffect(() => {
    // Сброс флага при смене пользователя
    if (user?.id !== currentUserIdRef.current) {
      hasFetchedRef.current = false;
      currentUserIdRef.current = user?.id || null;

      if (user) {
        fetchWordLists();
      }
    }
  }, [user, fetchWordLists]);

  if (loading) {
    return (
      <div className="word-lists-container">
        <div className="loading-card">
          <h2>🔄 Загружаем твои списки слов...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="word-lists-container">
        <div className="error-card">
          <h2>😔 Что-то пошло не так</h2>
          <p>{error}</p>
          <button
            onClick={() => {
              dispatch(clearWordsError());
              dispatch(fetchWordListsRequest());
            }}
            className="retry-btn"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (wordLists.length === 0) {
    return (
      <div className="word-lists-container">
        <div className="empty-state-card">
          <h2>📚 У тебя пока нет списков слов</h2>
          <p>Но ты можешь их добавить!</p>
          <div className="emoji-decoration">✨ 🌟 📖 🎯 🚀</div>
          <Link to="/create-list" className="add-list-btn">
            + Добавить первый список
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="word-lists-container">
      <div className="word-lists-header">
        <h2>📚 Твои списки слов</h2>
        <Link to="/create-list" className="add-list-btn">
          + Добавить список
        </Link>
      </div>

      <div className="word-lists-grid">
        {[...wordLists]
          .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
          .map((listName) => {
            const isDeleting = deletingLists.has(listName);
            
            return (
              <div key={listName} className="word-list-card">
                <div className="list-icon">📖</div>
                <h3>{listName}</h3>
                <div className="list-actions">
                  <Link
                    to={`/word-list/${encodeURIComponent(listName)}`}
                    className="view-btn"
                    title="Открыть список"
                  >
                    Изучать ▶️
                  </Link>
                  <div className="list-actions-row">
                    <Link
                      to={`/edit-list/${encodeUrlSafe(listName)}`}
                      className="edit-btn"
                      title="Редактировать список"
                    >
                      ✏️
                    </Link>
                    <button
                      onClick={() => deleteWordList(listName)}
                      className="delete-btn"
                      disabled={isDeleting}
                      title="Удалить список"
                    >
                      {isDeleting ? "⏳" : "🗑️"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default WordListsContent;
