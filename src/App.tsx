import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import useLocalStorage from './hooks/UseLocalStorage'; 

interface Book {
  title: string;
  author: string;
  year: string;
}

// Actions for useReducer
const actionTypes = {
  ADD_BOOK: 'ADD_BOOK',
  DELETE_BOOK: 'DELETE_BOOK',
  UPDATE_BOOK: 'UPDATE_BOOK',
  SET_BOOKS: 'SET_BOOKS' as const, // Added SET_BOOKS action type
};

// Reducer function
const bookReducer = (state: Book[], action: any): Book[] => {
  switch (action.type) {
    case actionTypes.ADD_BOOK:
      return [...state, action.payload];
    case actionTypes.DELETE_BOOK:
      return state.filter((_, index) => index !== action.payload);
    case actionTypes.UPDATE_BOOK:
      return state.map((book, index) =>
        index === action.payload.index ? action.payload.book : book
      );
    case actionTypes.SET_BOOKS: // Added SET_BOOKS case
      return action.payload;
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [books, dispatch] = useReducer(bookReducer, []);

  const [localBooks, setLocalBooks] = useLocalStorage<Book[]>('books', [
    { title: 'Software development', author: 'karanja', year: '2000' },
    { title: 'Book 2', author: 'malanga', year: '2005' },
    { title: 'Software project', author: 'Author 3', year: '2010' },
    { title: 'client side programming', author: 'Alice', year: '2015' },
    { title: 'server side programming', author: 'Author 5', year: '2020' },
    { title: 'discrete maths', author: 'Author 6', year: '2021' },
    { title: 'Mobile application', author: 'Author 7', year: '2022' },
    { title: 'Book 8', author: 'Author 8', year: '2023' },
    { title: 'Book 9', author: 'Author 9', year: '2024' },
    { title: 'Book 10', author: 'Author 10', year: '2025' },
  ]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const booksPerPage: number = 5;

  const titleRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize books from local storage
    dispatch({ type: actionTypes.SET_BOOKS, payload: localBooks });
  }, [localBooks]);

  const addBook = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const newBook: Book = {
      title: titleRef.current!.value,
      author: authorRef.current!.value,
      year: yearRef.current!.value,
    };
    dispatch({ type: actionTypes.ADD_BOOK, payload: newBook });
    titleRef.current!.value = '';
    authorRef.current!.value = '';
    yearRef.current!.value = '';
    setLocalBooks([...books, newBook]); // Update local storage
  };

  const deleteBook = (index: number): void => {
    dispatch({ type: actionTypes.DELETE_BOOK, payload: index });
    setLocalBooks(books.filter((_, idx) => idx !== index)); // Update local storage
  };

  const updateBook = (index: number): void => {
    const updatedBook: Book = {
      title: titleRef.current!.value,
      author: authorRef.current!.value,
      year: yearRef.current!.value,
    };
    
    dispatch({ type: actionTypes.UPDATE_BOOK, payload: { index, book: updatedBook } });
    titleRef.current!.value = '';
    authorRef.current!.value = '';
    yearRef.current!.value = '';
    setLocalBooks(books.map((book, idx) => idx === index ? updatedBook : book));
    if (titleRef.current) {
      titleRef.current.focus();
    }
  };
  
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * booksPerPage,
    currentPage * booksPerPage
  );

  const nextPage = useCallback(() => {
    if (currentPage < Math.ceil(filteredBooks.length / booksPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, filteredBooks.length]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  return (
    <div className='App'>
      <h1>Kirinyaga IT Course Books</h1>
      <form onSubmit={addBook}>
        <input type="text" placeholder="Book Title" ref={titleRef} required />
        <input type="text" placeholder="Author" ref={authorRef} required />
        <input type="number" placeholder="Year Of Publication" ref={yearRef} required />
        <button type="submit">Add Book</button>
      </form>
      <input
        type="text"
        placeholder="Search by title..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <table className='book-table'>
        <thead>
          <tr>
            <th>Book Title</th>
            <th>Author</th>
            <th>Year</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {paginatedBooks.map((book, index) => (
            <tr key={index}>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.year}</td>
              <td>
                <button onClick={() => deleteBook(index)}>Delete</button>
                <button onClick={() => updateBook(index)}>Update</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='pagination'>
        <button onClick={prevPage} disabled={currentPage === 1}>
          Previous
        </button>
        <button
          onClick={nextPage}
          disabled={currentPage === Math.ceil(filteredBooks.length / booksPerPage)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default App;