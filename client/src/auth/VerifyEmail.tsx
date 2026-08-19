import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/zustand/useUserStore";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const VerifyEmail = () => {
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const inputRef = useRef<(HTMLInputElement | null)[]>([]);

    const { loading } = useUserStore();
    const verifyEmail = async (_code: string) => {};
    const navigate = useNavigate();

    const handleChange = (index: number, value: string) => {
        if (/^[a-zA-Z0-9]$/.test(value) || value === "") {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);
        }
        // Move to next Input field if a digit is entered
        if (value !== "" && index < 5) {
            inputRef.current[index + 1]?.focus();
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRef.current[index - 1]?.focus();
        }
    }

    const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const verificationCode:string = otp.join("");
        try {
            await verifyEmail(verificationCode);
            navigate("/profile");
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen  w-full">
            <div className="p-8 rounded-md w-full max-w-md flex flex-col gap-5 border border-gray-200 bg-white">
                <div className="text-center">
                    <h1 className="font-extrabold text-2xl text-textPrimary mb-2">Verify your Email</h1>
                    <p className="text-sm text-textSecondary">
                        We have sent you a 6 digit code to your email. Please enter it below to verify your email.
                    </p>
                </div>
                <form onSubmit={submitHandler}>
                    <div className="flex justify-between">
                        {
                            otp.map((item: string, index: number) => (
                                <Input
                                    key={index}
                                    ref={(el) => {
                                        inputRef.current[index] = el;
                                    }}
                                    type="text"
                                    maxLength={1}
                                    value={item}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                                    className="md:w-12 md:h-12 w-8 h-8 text-center text-sm md:text-2x1 font-normal md:font-bold rounded-lg foucs:outline-none
                                focus:ring-2 focus:ring-brandOrange"
                                />
                            ))
                        }
                    </div>
                    {
                        loading ? <Button disabled className="w-full
                            mt-2 bg-brandOrange text-white py-2 rounded-md hover:bg-opacity-90 transition border-transparent focus-visible:outline-noner-transparent">
                            <Loader2 className="animate-spin h-4 w-4" /> Please wait...
                        </Button> : (
                            <Button type="submit" className="w-full mt-6 bg-brandOrange text-white py-2 rounded-md hover:bg-opacity-90 transition border-transparent focus-visible:outline-noner-transparent">Verify</Button>
                        )
                    }
                </form>
            </div>
        </div>
    )
}

export default VerifyEmail