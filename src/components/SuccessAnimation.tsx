

interface SuccessAnimationProps {
    size?: number;
}

/**
 * Animação de sucesso com checkmark
 */
export default function SuccessAnimation({ size = 80 }: SuccessAnimationProps) {
    return (
        <div className="success-checkmark" style={{ width: size, height: size }}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 52 52"
                className="w-full h-full"
            >
                <circle
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2"
                />
                <path
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 27l7.5 7.5L38 18"
                />
            </svg>
        </div>
    );
}
