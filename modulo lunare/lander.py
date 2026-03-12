#costruiamo un suolo lunare e facciamo atterrare un modulo lunare
import gymnasium as gym
from stable_baselines3 import PPO 
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.logger import configure
from stable_baselines3.common.callbacks import BaseCallback

#creiamo una callback per visualizzare l'ambiente
class RenderCallback(BaseCallback):
    #definiamo il metodo costruttore
    def __init__(self, env, freq= 100, verbose= 0):
        super(RenderCallback,self).__init__(verbose)
        self.env = env
        self.render_freq = freq
        
    #definiamo il metodo _on_step che viene chiamato ad ogni step
    def _on_step(self) -> bool:
        if self.n_calls % self.render_freq == 0: #<- ogni 100 passi viene resettato l'ambiente
            self.env.render()
        return True

#costruiamo un istanza nel nostro ambiete d'apprendimento
train_env = gym.make("LunarLander-v3", render_mode = "human")
#impostiamo i monitor per poter ricevere i log
reain_env = Monitor(train_env)
#path per i log
log_path = "./ppo_lunar_logs/"
new_logger = configure(log_path, ["tensorboard"])

#istanziamo il modello PPO
model = PPO(
    #impostiamo la rete neurale
    "MlpPolicy",
    #modello pa applicare all'ambiente
    train_env,
    verbose = 1,
    learning_rate =3*10-4,
    n_steps = 2048,
    batch_size=64,
    gamma=0.99,
    gae_lambda=0.95,
    ent_coef=0.5,
    vf_coef=0.5,
    max_grad_norm=0.5
)
#logger
model.set_logger(new_logger)
#callback
render_callback = RenderCallBack(train_env, freq=100)
#addestramento
model.learn(total_timesteps=500000, callback=render_callback)

model.save("ppo_lunar_lander")

model = PPO.load("ppo_lunar_lander")

#ambiente test
test_env = gym.make("LunarLander-v2", render_mode = "human")

while true:
    observation, info = test_env.reset(seed=42)
    done = False
    total_reward =0
    #ciclo interno sul numero di predizioni
    while not done:
        action, _ = model.predict(observation, deterministic=True) #<- vogliamo le risposte deterministiche fatte precedentemente
        observation, reward, terminated, truncated, info = test_env.step(action)
        done = terminated or truncated
        total_reward += reward
    print("Episode finished! Total reward:", total_reward)

        