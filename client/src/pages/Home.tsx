import background from '../assets/images/background.png'

const Home = () => {
    return (
        <div
            className='flex w-full justify-between h-[100vh] p-6'>
            <div className='h-[100%] p-[22px] rounded-4xl w-[20%] bg-[#ecf5b7]'>
                <div className='w-full h-full bg-[#83d007] rounded-4xl'>

                </div>
            </div>
            <div
                style={{
                    backgroundImage: `url(${background})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                }}
                className='h-[100%] rounded-4xl w-[79%]'
            >

            </div>
        </div>
    )
}

export default Home