import "./PaginationControls.css";

function PaginationControls({ pagination, onPageChange, isLoading = false }) {
  const totalPages = Math.max(Number(pagination?.totalPages) || 0, 1);
  const pageNumber = Math.min(
    Math.max(Number(pagination?.pageNumber) || 1, 1),
    totalPages
  );

  const goToPreviousPage = () => {
    if (!isLoading && pageNumber > 1) {
      onPageChange(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (!isLoading && pageNumber < totalPages) {
      onPageChange(pageNumber + 1);
    }
  };

  return (
    <nav className="pagination-controls" aria-label="Paginacion">
      <button
        type="button"
        onClick={goToPreviousPage}
        disabled={isLoading || pageNumber <= 1}
      >
        Anterior
      </button>

      <span>
        Pagina {pageNumber} de {totalPages}
      </span>

      <button
        type="button"
        onClick={goToNextPage}
        disabled={isLoading || pageNumber >= totalPages}
      >
        Siguiente
      </button>
    </nav>
  );
}

export default PaginationControls;
