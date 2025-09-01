import React from 'react';
import { useParams } from 'react-router-dom';

const WordListPage: React.FC = () => {
  const { listName } = useParams<{ listName: string }>();

  return (
    <div className="word-list-page">
      <div className="fun-card">
        <h2>📖 Список: {listName}</h2>
        <p>Здесь будут слова из списка "{listName}"</p>
        <div className="coming-soon">
          <h3>🚧 В разработке 🚧</h3>
          <p>Скоро здесь появятся слова для изучения!</p>
        </div>
      </div>
    </div>
  );
};

export default WordListPage;
