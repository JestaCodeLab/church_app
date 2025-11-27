import React from 'react';

const AuthFooter = () => {
  return (
    <p className="text-center text-sm text-gray-500 mt-8">
       © {new Date().getFullYear()} {process.env.REACT_APP_PROJECT_NAME || 'The Church HQ'} Platform. All rights reserved.
    </p>
  );
};

export default AuthFooter;