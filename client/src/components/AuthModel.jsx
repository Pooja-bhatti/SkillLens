import React from 'react'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { IoMdClose } from "react-icons/io";
import Auth from '../pages/Auth';

function AuthModel({onClose}) {
    const {userData}=useSelector((state)=>state.user)
    useEffect(()=>{
        if(userData){
            onClose()
        }
    },[userData,onClose])

  return (
    <div className='fixed inset-0 z-[999] flex items-center justify-center bg-text-primary/15 backdrop-blur-[2px] px-4'>
        <div className='relative w-full max-w-md'>
            <button onClick={onClose}
            className='absolute top-8 right-8 text-text-secondary hover:text-text-primary text-xl transition cursor-pointer'>
                <IoMdClose size={18}/>


            </button>
            <Auth isModel={true}/>
        </div>

    </div>
  )
}

export default AuthModel