import { Link } from "react-router-dom";

function NotFound() {
    return(
        <div className="not-found">
            <div>PAGE DOESN'T EXIST</div>
            <Link to="/">
                <div className="btn">Go back to Home</div>
            </Link>
        </div>
    )
}

export default NotFound;