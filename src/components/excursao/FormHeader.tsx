import React from 'react';

interface FormHeaderProps {
    title: string;
    description: string;
}

export const FormHeader: React.FC<FormHeaderProps> = ({ title, description }) => {
    return (
        <header className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-white">
                {title}
            </h1>
            <p className="text-gray-300 text-sm sm:text-base">
                {description}
            </p>
        </header>
    );
};
