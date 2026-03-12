#costruiamo un suolo lunare e facciamo atterrare un modulo lunare
import gymnasium as gym
from stable_baselines3 import PPO, Monitor, Configure, BaseCallBack

#creiamo una callback per visualizzare l'ambiente
class RenderCallBack(BaseCallBack):
    #definiamo il metodo costruttore
    def __init__(self, env, freq= 100, verbose= 0):
        super(RenderCallBack,self).__init__(verbose)
        self.env = env
        self.render_freq = freq
        
    #definiamo il metodo _on_step che viene chiamato ad ogni step
    def _on_step(self) -> bool:
        if self.n_calls % self.render_freq == 0: #<- ogni 100 passi viene resettato l'ambiente
            self.env.render()
        return True

#costruiamo un istanza nel nostro ambiete d'apprendimento
train_env = gym.make("LunarLander-v2", render_mode = "human")
#impostiamo i monitor per poter ricevere i log
reain_env = Monitor(train_env)
#path per i log
log_path = "./ppo_lunar_logs/"
new_logger = configure(log_path, ["tensorboard"])



