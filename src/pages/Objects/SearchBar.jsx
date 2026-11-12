import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { getSearchTerms } from '../../utils/searchText';
import './SearchBar.css';

const SEARCH_MAX_LENGTH = 100;

function SearchBar({ value, onChange }) {
  const inputRef = useRef(null);
  const hasOnlyIgnoredCharacters = value.trim() !== '' && getSearchTerms(value).length === 0;

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <form className="search-bar" role="search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="pesquisa-objetos" className="visually-hidden">
        Pesquisar objetos
      </label>
      <div className="search-bar__field">
        <Search className="search-bar__icon" size={20} strokeWidth={1.75} aria-hidden="true" />
        <input
          ref={inputRef}
          id="pesquisa-objetos"
          type="search"
          className="search-bar__input"
          placeholder="Pesquise por nome, código, descrição, local ou categoria"
          value={value}
          maxLength={SEARCH_MAX_LENGTH}
          autoComplete="off"
          spellCheck="false"
          aria-describedby="pesquisa-objetos-ajuda"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && value) {
              event.preventDefault();
              handleClear();
            }
          }}
        />
        {value && (
          <button type="button" className="search-bar__clear" onClick={handleClear} aria-label="Limpar pesquisa">
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>
      <p id="pesquisa-objetos-ajuda" className={`search-bar__hint${hasOnlyIgnoredCharacters ? ' search-bar__hint--warning' : ''}`}>
        {hasOnlyIgnoredCharacters
          ? 'Digite ao menos uma letra ou número para pesquisar.'
          : 'Acentos e letras maiúsculas são ignorados. Exemplo: "lapis" encontra "lápis".'}
      </p>
    </form>
  );
}

export default SearchBar;
