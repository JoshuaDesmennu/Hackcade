import "./games.css"
import Image from "next/image";

export default function Games() {
    return (
        <>
            <nav>
                <a className="nav-header">HackCade</a>
                <div className="right">
                    <a className="nav-actions">How2Play</a>
                    <a className="nav-actions">About Me</a>
                    <a className="nav-actions">Settings</a>
                </div>
            </nav>
            <main>
                <section style={{
                        fontSize: 26,
                    }}>
                    <span className="loading">
                        Enjoy from my fun catalog of games
                    </span>
                    <div className="game-grid">
                        <div className="game-card">
                            <Image className="game-image" src="/file.svg" alt="Test Image" width={300} height={300}/>
                            <div className="game-text-container">
                                <span className="game-text">Example Game</span>
                            </div>
                        </div>
                   </div>
                </section>
            </main>
        </>
    );
}