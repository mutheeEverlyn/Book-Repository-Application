import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import axios from 'axios';
import { BarLoader } from 'react-spinners';

interface Book {
  id: number;
  title: string;
  author: string;
  year: number;  // Changed to number
}

// Actions for useReducer
const actionTypes = {
  ADD_BOOK: 'ADD_BOOK',
  DELETE_BOOK: 'DELETE_BOOK',
  UPDATE_BOOK: 'UPDATE_BOOK',
  SET_BOOKS: 'SET_BOOKS' as const,
};

// Reducer function
const bookReducer = (state: Book[], action: any): Book[] => {
  switch (action.type) {
    case actionTypes.ADD_BOOK:
      return [...state, action.payload].sort((a: Book, b: Book) => a.id - b.id); // Sort by ID
    case actionTypes.DELETE_BOOK:
      return state.filter((book: Book) => book.id !== action.payload);
    case actionTypes.UPDATE_BOOK:
      return state.map((book: Book) =>
        book.id === action.payload.id ? action.payload : book
      ).sort((a: Book, b: Book) => a.id - b.id); // Sort by ID after update
    case actionTypes.SET_BOOKS:
      return action.payload.sort((a: Book, b: Book) => a.id - b.id); // Sort by ID
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [books, dispatch] = useReducer(bookReducer, []);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [sortCriteria, setSortCriteria] = useState<string>('default'); // Sort criteria

  const booksPerPage: number = 5;
  const titleRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Book[]>('https://booksapi-0z3z.onrender.com/books');
      dispatch({ type: actionTypes.SET_BOOKS, payload: response.data });
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBook = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const newBook = {
      title: titleRef.current!.value,
      author: authorRef.current!.value,
      year: Number(yearRef.current!.value), 
    };

    setLoading(true);
    try {
      const response = await axios.post<Book>('https://booksapi-0z3z.onrender.com/books', newBook);
      dispatch({ type: actionTypes.ADD_BOOK, payload: response.data });
      resetForm();
    } catch (error) {
      console.error('Error adding book:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (id: number): Promise<void> => {
    setLoading(true);
    try {
      await axios.delete(`https://booksapi-0z3z.onrender.com/books/${id}`);
      dispatch({ type: actionTypes.DELETE_BOOK, payload: id });
    } catch (error) {
      console.error('Error deleting book:', error);
    } finally {
      setLoading(false);
    }
  };

  const startUpdateBook = (book: Book): void => {
    setCurrentBook(book);
    
    if (titleRef.current) titleRef.current.value = book.title;
    if (authorRef.current) authorRef.current.value = book.author;
    if (yearRef.current) yearRef.current.value = book.year.toString();
  };

  const updateBook = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!currentBook) return;

    const updatedBook = {
      id: currentBook.id,
      title: titleRef.current!.value,
      author: authorRef.current!.value,
      year: Number(yearRef.current!.value), // Convert year to number
    };

    setLoading(true);
    try {
      await axios.put<Book>(`https://booksapi-0z3z.onrender.com/books/${currentBook.id}`, updatedBook);
      dispatch({ type: actionTypes.UPDATE_BOOK, payload: updatedBook });
      resetForm();
      setCurrentBook(null);
    } catch (error) {
      console.error('Error updating book:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (titleRef.current) titleRef.current.value = '';
    if (authorRef.current) authorRef.current.value = '';
    if (yearRef.current) yearRef.current.value = '';
    setCurrentBook(null);
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedBooks = filteredBooks.sort((a, b) => {
    if (sortCriteria === 'author') {
      return a.author.localeCompare(b.author);
    } else if (sortCriteria === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortCriteria === 'year') {
      return b.year - a.year;
    } else {
      return a.id - b.id;
    }
  });

  const paginatedBooks = sortedBooks.slice(
    (currentPage - 1) * booksPerPage,
    currentPage * booksPerPage
  );

  const nextPage = useCallback(() => {
    if (currentPage < Math.ceil(sortedBooks.length / booksPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, sortedBooks.length]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  return (
    <div className='App'>
      <h1>Kirinyaga IT Course Books</h1>
      <form onSubmit={currentBook ? updateBook : addBook}>
        <input type="text" placeholder="Book Title" ref={titleRef} required />
        <input type="text" placeholder="Author" ref={authorRef} required />
        <input type="number" placeholder="Year Of Publication" ref={yearRef} required />
        <button type="submit" disabled={loading}>{currentBook ? 'Update Book' : 'Add Book'}</button>
      </form>
      <input
        type="text"
        placeholder="Search by title..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <span className='filter'>
        <label htmlFor="sortCriteria">Sort by: </label>
        <select id="sortCriteria" value={sortCriteria} onChange={(e) => setSortCriteria(e.target.value)}>
          <option value="default">Default</option>
          <option value="author">Author</option>
          <option value="title">Title</option>
          <option value="year">Year of Publication</option>
        </select>
      </span>
      {loading && <BarLoader color="blue" height={8}/>}
      <table className='book-table'>
        <thead>
          <tr>
            <th>ID NO</th>
            <th>Book Title</th>
            <th>Author</th>
            <th>Year Of Publication</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {paginatedBooks.map((book) => (
            <tr key={book.id}>
              <td>{book.id}</td>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.year}</td>
              <td>
                <button onClick={() => deleteBook(book.id)} disabled={loading}>Delete</button>
                <button onClick={() => startUpdateBook(book)} disabled={loading}>Update</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='pagination'>
        <button onClick={prevPage} disabled={currentPage === 1 || loading}>
          Previous
        </button>
        <button
          onClick={nextPage}
          disabled={currentPage === Math.ceil(sortedBooks.length / booksPerPage) || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default App;
