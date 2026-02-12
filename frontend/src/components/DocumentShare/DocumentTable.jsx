
import React from 'react';
import { Download, Share2, Trash2 } from 'lucide-react';

const DocumentTable = ({ loading, filteredDocs, handleDelete, handleDownload, handleShare, getFileIcon }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white">Recent Files</h3>
                <span className="text-sm text-gray-500">{filteredDocs.length} files</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading documents...</td></tr>
                        ) : filteredDocs.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No documents found. Upload one!</td></tr>
                        ) : (
                            filteredDocs.map((doc) => {
                                const { icon: FileIcon, color } = getFileIcon(doc.type);
                                return (
                                    <tr key={doc._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
                                                    <FileIcon size={20} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]" title={doc.name}>{doc.name}</div>
                                                    <div className="text-xs text-gray-500">{doc.type.toUpperCase()} File</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-aurora-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                                                    {doc.uploadedBy?.name ? doc.uploadedBy.name.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                                    {doc.uploadedBy?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {doc.size}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleDownload(doc)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleShare(doc)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    title="Copy link"
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc._id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DocumentTable;

