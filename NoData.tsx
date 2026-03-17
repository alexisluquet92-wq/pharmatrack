import Link from "next/link";

interface NoDataProps {
  message?: string;
}

export default function NoData({ message }: NoDataProps) {
  return (
    <div className="no-data fade-in">
      <div className="no-data-icon">📁</div>
      <div className="no-data-title">Aucune donnée importée</div>
      <div className="no-data-text" style={{ marginBottom: 20 }}>
        {message || "Importez votre stock depuis un fichier CSV ou XLSX pour voir les données ici."}
      </div>
      <Link href="/import" className="btn btn-primary">
        ⬆️ Importer des données
      </Link>
    </div>
  );
}
