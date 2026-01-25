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
                    className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    onClick={handleCloseModal}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-indigo-200/50 dark:border-indigo-800/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-indigo-100 dark:border-indigo-900/50 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Lock size={20} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-900 to-purple-900 dark:from-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
                                    {editingId ? 'Edit Entry' : 'Add New Entry'}
                                </h2>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                            >
                                <X size={20} className="text-gray-500 dark:text-gray-400" />
                            </motion.button>
                        </div>

                        <form onSubmit={handleFormSubmit(onSubmit)} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    {...register('title')}
                                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border ${errors.title ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-gray-900 dark:text-white transition-all font-medium`}
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
                                                    <Listbox.Button className="relative w-full cursor-default rounded-xl bg-white/50 dark:bg-gray-800/50 py-3 pl-4 pr-10 text-left border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white transition-all font-medium">
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
                                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-100'
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
                                                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
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
                                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-gray-900 dark:text-white transition-all font-medium"
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
                                            className={`w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border ${errors.username ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-gray-900 dark:text-white transition-all font-medium`}
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
                                            className={`w-full pl-11 pr-32 py-3 bg-white/50 dark:bg-gray-800/50 border ${errors.password ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-gray-900 dark:text-white transition-all font-mono`}
                                            placeholder="StrongPassword123!"
                                        />
                                        <button
                                            type="button"
                                            onClick={generatePassword}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-lg text-xs font-bold text-white transition-all shadow-sm hover:shadow-md"
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
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-gray-900 dark:text-white transition-all font-medium"
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
                                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 transition-all duration-200"
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
