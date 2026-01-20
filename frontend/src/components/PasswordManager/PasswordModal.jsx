import React, { useEffect } from 'react';
import { Lock, X, Eye, EyeOff, User as UserIcon, Key, Check, ChevronDown } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Listbox, Transition } from '@headlessui/react';

const schema = z.object({
    title: z.string().min(1, 'Title is required'),
    category: z.string().min(1, 'Category is required'),
    url: z.string().optional(),
    username: z.string().min(1, 'Username/Email is required'),
    password: z.string().min(1, 'Password is required'),
    notes: z.string().optional()
});

const PasswordModal = ({ isModalOpen, handleCloseModal, handleSubmit, formData, editingId, categories, error }) => {
    const {
        register,
        handleSubmit: handleFormSubmit,
        reset,
        control,
        setValue,
        watch,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            title: '',
            category: 'login',
            url: '',
            username: '',
            password: '',
            notes: ''
        }
    });

    const [passwordStrength, setPasswordStrength] = React.useState(0);
    const password = watch('password');

    useEffect(() => {
        setPasswordStrength(calculateStrength(password));
    }, [password]);

    const calculateStrength = (pwd) => {
        if (!pwd) return 0;
        let score = 0;
        if (pwd.length > 8) score++;
        if (pwd.length > 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return Math.min(score, 4);
    };

    const getStrengthColor = (score) => {
        if (score === 0) return 'text-gray-400';
        if (score < 2) return 'text-red-500';
        if (score < 3) return 'text-yellow-500';
        if (score < 4) return 'text-blue-500';
        return 'text-green-500';
    };

    const getStrengthLabel = (score) => {
        if (score === 0) return 'Empty';
        if (score < 2) return 'Weak';
        if (score < 3) return 'Fair';
        if (score < 4) return 'Good';
        return 'Strong';
    };

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
        let retVal = "";
        for (let i = 0, n = charset.length; i < 16; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        setValue('password', retVal, { shouldValidate: true, shouldDirty: true });
    };

    useEffect(() => {
        if (isModalOpen) {
            reset(formData);
        }
    }, [formData, isModalOpen, reset]);

    const onSubmit = (data) => {
        handleSubmit(data);
    };


    return (
        <AnimatePresence>
            {isModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
                    >
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {editingId ? 'Edit Entry' : 'Add New Entry'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit(onSubmit)} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    {...register('title')}
                                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${errors.title ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-gray-900 dark:text-white transition-all`}
                                    placeholder="e.g. Google Account"
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <Controller
                                        name="category"
                                        control={control}
                                        render={({ field }) => (
                                            <Listbox value={field.value} onChange={field.onChange}>
                                                <div className="relative mt-1">
                                                    <Listbox.Button className="relative w-full cursor-default rounded-xl bg-gray-50 dark:bg-gray-800 py-3 pl-4 pr-10 text-left border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 sm:text-sm text-gray-900 dark:text-white transition-all">
                                                        <span className="block truncate">
                                                            {categories.find(c => c.value === field.value)?.label || 'Select Category'}
                                                        </span>
                                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                            <ChevronDown
                                                                className="h-5 w-5 text-gray-400"
                                                                aria-hidden="true"
                                                            />
                                                        </span>
                                                    </Listbox.Button>
                                                    <Transition
                                                        as={React.Fragment}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                    >
                                                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-100 dark:border-gray-700">
                                                            {categories.map((cat, catIdx) => (
                                                                <Listbox.Option
                                                                    key={catIdx}
                                                                    className={({ active }) =>
                                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300' : 'text-gray-900 dark:text-gray-100'
                                                                        }`
                                                                    }
                                                                    value={cat.value}
                                                                >
                                                                    {({ selected }) => (
                                                                        <>
                                                                            <span
                                                                                className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                                                    }`}
                                                                            >
                                                                                {cat.label}
                                                                            </span>
                                                                            {selected ? (
                                                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600 dark:text-red-400">
                                                                                    <Check className="h-5 w-5" aria-hidden="true" />
                                                                                </span>
                                                                            ) : null}
                                                                        </>
                                                                    )}
                                                                </Listbox.Option>
                                                            ))}
                                                        </Listbox.Options>
                                                    </Transition>
                                                </div>
                                            </Listbox>
                                        )}
                                    />
                                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        URL
                                    </label>
                                    <input
                                        type="text"
                                        {...register('url')}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-gray-900 dark:text-white transition-all"
                                        placeholder="example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Username / Email <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <UserIcon size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            {...register('username')}
                                            className={`w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border ${errors.username ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-gray-900 dark:text-white transition-all`}
                                            placeholder="user@example.com"
                                        />
                                    </div>
                                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Key size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            {...register('password')}
                                            onChange={(e) => {
                                                register('password').onChange(e);
                                                // Trigger re-render for strength calc if needed or handled by watch/state
                                            }}
                                            className={`w-full pl-11 pr-32 py-3 bg-gray-50 dark:bg-gray-800 border ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-gray-900 dark:text-white transition-all font-mono`}
                                            placeholder="StrongPassword123!"
                                        />
                                        <button
                                            type="button"
                                            onClick={generatePassword}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}

                                    {/* Password Strength Indicator */}
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-gray-500 dark:text-gray-400 font-medium">Strength</span>
                                            <span className={`font-bold ${getStrengthColor(passwordStrength)}`}>
                                                {getStrengthLabel(passwordStrength)}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex gap-0.5">
                                            {[...Array(4)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-full flex-1 transition-all duration-300 ${i < passwordStrength
                                                        ? getStrengthColor(passwordStrength).replace('text-', 'bg-')
                                                        : 'bg-transparent'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                        <Lock size={12} /> Stored securely in your encrypted vault.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    {...register('notes')}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-gray-900 dark:text-white transition-all"
                                    placeholder="Security questions, backup codes, etc."
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-gray-900 rounded-xl font-bold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    {editingId ? 'Save Changes' : 'Create Entry'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PasswordModal;
