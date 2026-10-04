import jwt from "jsonwebtoken";

const JWT_SECRET =
    process.env.JWT_SECRET || "medical_app_secret";

export const generateToken = (user: {
    user_id: number;
    username: string;
    role: string;
}) => {

    return jwt.sign(
        {
            user_id: user.user_id,
            username: user.username,
            role: user.role,
        },
        JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

export const verifyToken = (token: string) => {

    return jwt.verify(
        token,
        JWT_SECRET
    );

};